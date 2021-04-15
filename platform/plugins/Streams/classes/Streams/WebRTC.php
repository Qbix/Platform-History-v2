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
     * @method createOrJoinRoom
     * @param {string} $publisherId Id of room's publisher/initiator
     * @param {string} $roomId Room id in Qbix (last marp of stream name)
     * @return {Object}
     */
    function createOrJoinRoom($publisherId, $roomId, $resumeClosed);

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
     * Create or fetch Streams/webrtc stream
     * @method getOrCreateStream
     * @param {string} $publisherId publisher of stream
     * @param {string} $roomId Room Id of room (last part of stream name)
     * @param {string} $resumeClosed Return existing stream if it exist, or create new otherwise
     * @return {array} The keys are "stream", "created", "roomId", "socketServer"
     */
    static function getOrCreateStream($publisherId, $roomId, $resumeClosed) {
        $streamName = null;

        if(strpos($roomId, 'Streams/webrtc/') !== false) {
            $roomId = explode('/', $roomId)[2];
        }

        if (!empty($roomId)) {
            $streamName = "Streams/webrtc/$roomId";
            $stream = Streams::fetchOne($publisherId, $publisherId, $streamName);

            if (($stream && $resumeClosed) || ($stream && empty($stream->closedTime))) {

                if($resumeClosed) {
                    $stream->closedTime = null;
                    $stream->save();

                }
                return $stream;
            }
        }

        // check quota
        $quota = Users_Quota::check($publisherId, '', 'Streams/webrtc', true, 1, Users::roles());
        $text = Q_Text::get('Streams/content');
        $fields = array(
            'title' => Q::interpolate($text['webrtc']['streamTitle'], array(Streams::displayName($publisherId)))
        );

        // if stream with this roomId exist, create stream with new roomId
        if (!$stream) {
            $fields['name'] = $streamName;
        }
        $stream = Streams::create($publisherId, $publisherId, 'Streams/webrtc', $fields);

        // set quota
        if ($stream && $quota instanceof Users_Quota) {
            $quota->used();

            return $stream;
        }

        throw new Q_Exception("Failed during create webrtc stream");
    }
};