<?php
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Rest\Client;
/**
 * @module Streams
 */

interface Streams_WebRTC_Interface
{
    /**
     * Interface that an adapter must support
     * to implement the Streams_WebRTC class.
     * @class Streams_WebRTC_Interface
     * @constructor
     */

    /**
     * @method getRoomStream
     * @param {string} $publisherId Id of room's publisher/initiator
     * @param {string} $roomId Room id in Qbix (last marp of stream name)
     * @return {Object}
     */
    function getRoomStream($publisherId, $roomId, $resumeClosed, $writeLevel);

}

/**
 * Base class for Streams_WebRTC_... adapters
 *
 * @class Streams_WebRTC
 */
abstract class Streams_WebRTC
{

    /**
     * @method getTwilioTurnCredentials Retrievs credentials for using twilio turn server
     * @return {Array|null}
     * @throws Twilio_Exception
     */
    function getTwilioTurnCredentials() {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');

        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);

        $token = $twilio->tokens->create();

        return $token->iceServers[1];
    }

    /**
     * Fetch Streams/webrtc stream and check permissions
     * @method fetchStream
     * @param {string} $publisherId publisher of stream
     * @param {string} $roomId Room Id of room (last part of stream name)
     * @param {string} $resumeClosed Return existing stream if it exist, or create new otherwise
     * @return {array} The keys are "stream", "created", "roomId", "socketServer"
     */
    static function fetchStream($publisherId, $roomId, $resumeClosed) {
        if (!empty($roomId)) {
            $streamName = "Streams/webrtc/$roomId";
            $stream = Streams::fetchOne($publisherId, $publisherId, $streamName);

            if (($stream && $resumeClosed) || ($stream && empty($stream->closedTime))) {

                if($resumeClosed) {
                    $stream->closedTime = null;
                    $stream->save();

                }

                $userId = Users::loggedInUser(true)->id;

                if((int) $stream->fields['writeLevel'] == 0 && $stream->fields['publisherId'] != $userId) {

                    /*$invites = Streams_Invited::select()->where(
                        compact('publisherId', 'streamName', 'userId')
                    )->fetchDbRows();
                    $invites = Streams_Invite::forStream($publisherId, $streamName, $user->id);
                    print_r($invites);die;*/
                    $access = new Streams_Access();
                    $access->publisherId = $publisherId;
                    $access->streamName = $streamName;
                    $access->ofUserId = $userId;
                    if (!$access->retrieve()) {
                        throw new Users_Exception_NotAuthorized();
                    }

                }

                return $stream;
            }
        }

        return false;
    }

    /**
     * Create Streams/webrtc stream
     * @method createStream
     * @param {string} $publisherId publisher of stream
     * @param {string} $roomId Room Id of room (last part of stream name)
     * @param {string} $resumeClosed Return existing stream if it exist, or create new otherwise
     * @return {array} The keys are "stream", "created", "roomId", "socketServer"
     */
    static function createStream($publisherId, $roomId, $resumeClosed, $writeLevel) {
        $streamName = null;

        if (!empty($roomId)) {
            $streamName = "Streams/webrtc/$roomId";
        }

        // check quota
        //UNCOMMENT BEFORE COMMIT$quota = Users_Quota::check($publisherId, '', 'Streams/webrtc', true, 1, Users::roles());
        $text = Q_Text::get('Streams/content');
        $fields = array(
            'title' => Q::interpolate($text['webrtc']['streamTitle'], array(Streams::displayName($publisherId)))
        );

        $fields['name'] = $streamName;
        $fields['writeLevel'] = $writeLevel;

        $stream = Streams::create($publisherId, $publisherId, 'Streams/webrtc', $fields);
        if ($stream) return $stream;
        // set quota
        /*UNCOMMENT BEFORE COMMIT if ($stream && $quota instanceof Users_Quota) {
            $quota->used();

            return $stream;
        }*/

        throw new Q_Exception("Failed during create webrtc stream");
    }

    /**
     * Create or fetch Streams/webrtc stream
     * @method getOrCreateStream
     * @param {string} $publisherId publisher of stream
     * @param {string} $roomId Room Id of room (last part of stream name)
     * @param {string} $resumeClosed Return existing stream if it exist, or create new otherwise
     * @return {array} The keys are "stream", "created", "roomId", "socketServer"
     */
    static function getOrCreateStream($publisherId, $roomId, $resumeClosed, $writeLevel) {
        $streamName = null;

        if(strpos($roomId, 'Streams/webrtc/') !== false) {
            $roomId = explode('/', $roomId)[2];
        }

        $existingRoomStream = self::fetchStream($publisherId, $roomId, $resumeClosed);
        if($existingRoomStream) {
            return $existingRoomStream;
        } else {
            return self::createStream($publisherId, $roomId, $resumeClosed, $writeLevel);
        }

        throw new Q_Exception("Failed during create webrtc stream");
    }

    /**
     * Create or fetch Streams/webrtc stream
     * @method mergeRecordings
     * @param {string} $publisherId publisher of stream
     * @param {string} $roomId Room Id of room (last part of stream name)
     * @param {string} $resumeClosed Return existing stream if it exist, or create new otherwise
     * @return {array} The keys are "stream", "created", "roomId", "socketServer"
     */
    static function mergeRecordings($publisherId, $roomId) {

        if(strpos($roomId, 'Streams/webrtc/') !== false) {
            $roomId = explode('/', $roomId)[2];
        }

        $app = Q::app();
        $recsPath = (defined('APP_FILES_DIR') ? APP_FILES_DIR : Q_FILES_DIR).DS.$app.DS.'uploads'.DS.'Streams'.DS.'webrtc_rec'.DS.$roomId;

        $startTimes = array_diff(scandir($recsPath), array('.', '..'));

        //check if call already merged
        $callsToMerge = [];
        foreach ($startTimes as $dir) {
            if (!file_exists($recsPath.DS.$dir.DS.'audio.mp3')) {
                array_push($callsToMerge, $dir);
            }
        }

        $recordings = [];
        //scan calls that were happened at specific times
        foreach ($callsToMerge as $callTime) {
            $callUsers = array_diff(scandir($recsPath.DS.$callTime), array('.', '..'));

            //scan users directories
            foreach ($callUsers as $usersRecordingsDir) {
                $fileInfo = pathinfo($usersRecordingsDir);
                if($fileInfo['extension'] == 'json') {
                    $recInfo = file_get_contents($recsPath.DS.$callTime.DS.$usersRecordingsDir);
                    $filename = explode('_', $fileInfo['filename']);
                    $recordings[$callTime][$filename[0] . "\t" . $filename[1]] = json_decode($recInfo, true);
                    continue;
                } else {
                    continue;
                }
            }

        }

        if(count($recordings) == 0) {
            return false;
        }

        function isStartRecording($username, $users) {
            foreach ($users as $key => $recording) {
                if(!array_key_exists('parallelRecordings', $recording)) {
                    continue;
                }

                foreach ($recording['parallelRecordings'] as $parallelRecording) {
                    if($parallelRecording['participant']['username'] == $username)
                    return false;
                }
            }

            return true;
        }

        function getPath($parallelRecording, $room) {
            foreach ($room as $username => $info) {

                if($username == $parallelRecording['participant']['username']) {
                    return $room[$username];
                }
            }
            return null;
        }

        function setParallelRecPath($room) {
            foreach ($room as $username => $info) {
                if(!array_key_exists('parallelRecordings', $info)) {
                    continue;
                }
                foreach ($info['parallelRecordings'] as $key => $parallelRecording) {
                    $user = getPath($parallelRecording, $room);
                    if(!is_null($user)) {
                        $info['parallelRecordings'][$key]['path'] = $user['path'];
                        $info['parallelRecordings'][$key]['recordingInstance'] = $user;
                    }
                }

                $room[$username]['parallelRecordings'] = $info['parallelRecordings'];


            }

            return $room;
        }


        foreach ($recordings as $key => $room) {
            $recordings[$key] = setParallelRecPath($room);

            $startRecording = null;
            foreach ( $recordings[$key] as $username => $info) {
                if(isStartRecording($username, $room)) {
                    $startRecording = $info;
                }
            }

            $localRecordDir = $recsPath . '/' . $key;
            $inputsNum = 1;
            $inputsLet = 'a';
            $offsetFromFirstRec = 0;
            $offsets = [];
            $processedRecsToSkip = [];
            $offsetsIndexes = [];
            $inputs = [];
            array_push($inputs, '-i', $startRecording['path']);
            array_push($startRecording['participant']['username'], $processedRecsToSkip);
            $currentRecording = $startRecording;
            while($currentRecording != null) {
                if(count($currentRecording['parallelRecordings']) == 0) {
                    $currentRecording = null;
                    continue;
                }

                foreach($currentRecording['parallelRecordings'] as $paralelRec) {
                    if(array_search($paralelRec['participant']['username'], $processedRecsToSkip) !== false) {
                        continue;
                    }

                    array_push($inputs, '-i', $paralelRec['path']);
                    $inputsLet =  chr(ord(substr($inputsLet, 0)) + 1);
                    array_push($offsets, '[' . $inputsNum . ']adelay=' . ($offsetFromFirstRec + floatval($paralelRec['time'])) . '|' . ($offsetFromFirstRec + floatval($paralelRec['time'])) . '[' . $inputsLet . ']');
                    array_push($offsetsIndexes, '[' . $inputsLet . ']');

                    $inputsNum++;
                    array_push($processedRecsToSkip, $paralelRec['participant']['username']);
                }

                $parallelRecThatEndsLast = array_reduce($currentRecording['parallelRecordings'], function($prev, $current) {
                        return $current['recordingInstance']['stopTime'] > $prev['recordingInstance']['stopTime'] ? $current : $prev;
                });

                $offsetFromFirstRec = floatval($offsetFromFirstRec) + floatval($parallelRecThatEndsLast['time']);
                $currentRecording = $parallelRecThatEndsLast['stopTime'] > $currentRecording['stopTime'] ? $parallelRecThatEndsLast['recordingInstance'] : null;
            }

            array_unshift($inputs,'-y');

            $amix = '[0]';
            foreach($offsetsIndexes as  $offset) {
                $amix .= $offset;
            }

            $delays = implode(';', $offsets);
            array_push($inputs, '-filter_complex', '"' . $delays . ($delays != ''? ';' : '') . $amix . 'amix=inputs=' . $inputsNum . '"');
            array_push($inputs,
                '-acodec', 'libmp3lame',
                $localRecordDir . '/audio.mp3');
            $output=null;
            $retval=null;
            $command = "/usr/bin/ffmpeg " . (implode(' ', $inputs)) . ' 2>&1';
            exec($command,$output);
            print_r($command);
            print_r($output);die;
        }
    }
};