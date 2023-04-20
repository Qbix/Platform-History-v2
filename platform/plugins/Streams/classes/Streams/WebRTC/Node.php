<?php


/**
 * This class represents WebRTC rooms
 * @class Streams_WebRTC_Node
 * @constructor
 * @module Streams
 */
class Streams_WebRTC_Node extends Streams_WebRTC implements Streams_WebRTC_Interface
{
    /**
     * Creates or joins a room
     * @method getRoomStream
     * @param {string} $publisherId Id of room's publisher/initiator
     * @param {string} $roomId Room id in Qbix (last marp of stream name)
     * @param {string} $resumeClosed Use existing stream if it exists
     * @return {array} The keys are "stream", "created", "roomId", "socketServer"
     */
    function getRoomStream($publisherId, $roomId, $resumeClosed, $writeLevel) {
        if (empty($publisherId)) {
            throw new Q_Exception_RequiredField(array('field' => 'publisherId'));
        }
        $webrtcStream = Streams_WebRTC::getOrCreateStream($publisherId, $roomId, $resumeClosed, $writeLevel);

        if ($webrtcStream && $resumeClosed) {
            $webrtcStream->closedTime = null;
            $webrtcStream->changed();

            $endTime = $webrtcStream->getAttribute('endTime');
            $startTime = $webrtcStream->getAttribute('startTime');
            if($startTime == null || ($endTime != null && round(microtime(true) * 1000) > $endTime)) {
                $startTime =  round(microtime(true) * 1000);
                $webrtcStream->setAttribute('startTime', $startTime);
                $webrtcStream->clearAttribute('endTime');
                $webrtcStream->save();
            }
        }

        return $webrtcStream;
    }

    function createWaitingRoomStream() {
        $userId = Users::loggedInUser(true)->id;
        $fields = array(
            'title' => Streams::displayName($userId) . " waiting room"
        );

        $fields['readLevel'] = 0;
        $fields['writeLevel'] = 0;
        $fields['adminLevel'] = 0;

        $stream = Streams::create($userId, $userId, 'Streams/webrtc', $fields);
        if($stream) {
            $stream->setAttribute('isWaitingRoom', true);
            $stream->save();
            return $stream;
        } else {
            throw new Exception("Something went wrong when creating waiting room");
        }
    }

    function getRoomStreamByInviteToken($inviteToken, $resumeClosed)
    {
        $invite = Streams_Invite::fromToken($inviteToken, true);
       
        if ($invite) {
            $stream = Streams_Stream::fetch(Users::loggedInUser(true)->id, $invite->publisherId, $invite->streamName, true);
    
            return $stream;
        } else {
            throw new Exception("Such invite token doesn't exist");
        }
    }

    function getRoomStreamRelatedTo($toPublisherId, $toStreamName, $fromPublisherId, $fromStreamName, $type, $resumeClosed) {
        if (empty($toPublisherId)) {
            throw new Q_Exception_RequiredField(array('field' => 'publisherId'));
        }

        $fields = array(
            "toPublisherId" => $toPublisherId,
            "toStreamName" => $toStreamName,
            "type" => $type
        );

        if(!is_null($fromPublisherId)) {
            $fields['fromPublisherId'] = $fromPublisherId;
        }
        if(!is_null($fromStreamName)) {
            $fields['fromStreamName'] = $fromStreamName;
        }
        
        $lastRelated = Streams_RelatedTo::select()->where($fields)->orderBy("weight", false)->limit(1)->fetchDbRow();

        if ($lastRelated) {
            $webrtcStream = Streams_Stream::fetch(null, $lastRelated->fields['fromPublisherId'], $lastRelated->fields['fromStreamName']);

            if ($webrtcStream && $resumeClosed) {
                $webrtcStream->closedTime = null;
                $webrtcStream->changed();

                $endTime = $webrtcStream->getAttribute('endTime');
                $startTime = $webrtcStream->getAttribute('startTime');
                if($startTime == null || ($endTime != null && round(microtime(true) * 1000) > $endTime)) {
                    $startTime =  round(microtime(true) * 1000);
                    $webrtcStream->setAttribute('startTime', $startTime);
                    $webrtcStream->clearAttribute('endTime');
                    $webrtcStream->save();
                }


            }

            if (!$webrtcStream->testWriteLevel('join')) {
                throw new Users_Exception_NotAuthorized();
            }
            return $webrtcStream;
        }


        return null;
    }

    /**
     * @method endRoom Ends conference room by setting endedTime attribute after last participant left the room.
     * @param {string} $publisherId Id of room's publisher/initiator
     * @param {string} $roomId Room id in Qbix (last marp of stream name)
     * @return {Object}
     */
    function endRoom($publisherId, $roomId) {
        if (empty($publisherId) || empty($roomId)) {
            $field = empty($publisherId) ? 'publisherId' : 'roomId';
            throw new Q_Exception_RequiredField(array('field' => $field));
        }

        if(strpos($roomId, 'Streams/webrtc/') !== false) {
            $roomId = explode('/', $roomId)[2];
        }

        $streamName = "Streams/webrtc/$roomId";
        $stream = Streams_Stream::fetch($publisherId, $publisherId, $streamName);
        //$stream->setAttribute('endTime', time());
        //$stream->changed();

        return (object) [
            'stream' => $stream,
            'roomId' => $stream->name
        ];
    }

    function getTwilioTurnCredentials() {
        return parent::getTwilioTurnCredentials();
    }

}