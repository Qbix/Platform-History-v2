<?php
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Rest\Client;
/**
 * @module Streams
 */
/**
 * Class contains common methods for Webrtc tool
 *
 * @class Streams_WebRTC
 */
class Streams_Webrtc
{
    static function createRoom() {
        $loggedUserId = Users::loggedInUser(true)->id;

        $stream = Streams::create($loggedUserId, $loggedUserId, 'Streams/webrtc');
        $roomName = str_replace("Streams/webrtc","", $stream->name);
        $twilioRoom = static::createTwilioRoom($roomName);
        $stream->setAttribute('twilioRoomSid', $twilioRoom->sid);
        $stream->save();

        return $stream;
    }

    static function createTwilioRoom($roomName) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'apiSecret');


        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);

        $room = $twilio->video->v1->rooms->create(array("uniqueName" => $roomName));
        //print_r($room);die;
        return $room;
    }

    static function getTwilioRoom($sid) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'apiSecret');


        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);

        $room = $twilio->video->v1->rooms($sid)->fetch();
        return $room;
    }

    static function getTwilioParticipant($sid) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'apiSecret');

        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);
        $twilioParticipant = $twilio->video->rooms($sid)->participants->read(array("status" => "connected"));

        return $twilioParticipant;
    }

    static function getTwilioAccessToken($sid) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'apiSecret');

        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);

        $room = $twilio->video->v1->rooms($sid)->fetch();

        $identity = Users::loggedInUser(true)->displayName(array('short' => false));

        // Create access token, which we will serialize and send to the client
        $token = new AccessToken($twilioAccountSid, $twilioApiKey, $twilioApiSecret, 3600, $identity);

        // Create Video grant
        $videoGrant = new VideoGrant();
        $videoGrant->setRoom($room->sid);

        // Add grant to token
        $token->addGrant($videoGrant);

        return $token->toJWT();
    }

};