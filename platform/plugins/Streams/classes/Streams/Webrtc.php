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
    static function createRoom($publisherId, $streamName) {
        $loggedUserId = Users::loggedInUser(true)->id;

        if(isset($publisherId) && !empty($publisherId) && isset($streamName) && !empty($streamName)) {
            $stream = Streams::create($publisherId, $publisherId, 'Streams/webrtc', [
                'name' => 'Streams/webrtc/' . $streamName,
            ]);

        } else {
            $stream = Streams::create($loggedUserId, $loggedUserId, 'Streams/webrtc');
        }
        //print_r($stream);die;

        $roomName = str_replace("Streams/webrtc","", $stream->name);
        $twilioRoom = static::createTwilioRoom();
        $stream->setAttribute('twilioRoomSid', $twilioRoom->sid);
        $stream->setAttribute('twilioRoomName', $twilioRoom->uniqueName);
        $stream->changed();

        return $stream;
    }
    static function joinRoom($loggedUserId, $publisherId, $streamName) {
        $stream = Streams::fetchOne($loggedUserId, $publisherId, $streamName);
        $participants = $stream->getParticipants(array(
            "state" => "participating"
        ));
        if (!isset($participants[$loggedUserId])) {
            $stream->join();
        } else {

            Streams_Message::post(null, $publisherId, $streamName, array(
                'type' => 'Streams/connected'
            ), true);
        }

        $twilioRoomSid = $stream->getAttribute('twilioRoomSid');
        $twilioRoomName = $stream->getAttribute('twilioRoomName');
		if (!$twilioRoomSid) {
            $twilioRoom = static::createTwilioRoom();
            $stream->setAttribute('twilioRoomSid', $twilioRoom->sid);
            $stream->setAttribute('twilioRoomName', $twilioRoom->uniqueName);
            $stream->changed();
		} else {
            try {
                $twilioRoom = static::getTwilioRoom($twilioRoomName);
            } catch (Exception $e) {
                //die('catch');
                $twilioRoom = static::createTwilioRoom();
                $stream->setAttribute('twilioRoomSid', $twilioRoom->sid);
                $stream->setAttribute('twilioRoomName', $twilioRoom->uniqueName);
                $stream->changed();
            }

        }

        //print_r($twilioRoom);die('1213');
        return $stream;
    }

    static function createTwilioRoom() {
        //die($roomName);
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');


        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);
        $roomUniqueName = static::makeRandomName();
        $room = $twilio->video->v1->rooms->create(array("uniqueName" => $roomUniqueName));

        //print_r($room);die;
        return $room;
    }

    static function makeRandomName() {
        $text = "";
        $possible = "0123456789";
        $max = strlen($possible)-1;
        for ($i = 0; $i < 6; $i++) {
            $text .= $possible[rand(0,$max)];
        }
        return $text;
    }

    static function getTwilioRoom($sidOrName) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');


        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);

        $room = $twilio->video->v1->rooms($sidOrName)->fetch();

        return $room;
    }

    static function getTwilioParticipant($sid) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');

        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);
        $twilioParticipant = $twilio->video->rooms($sid)->participants->read(array("status" => "connected"));

        return $twilioParticipant;
    }

    static function getTwilioAccessToken($sid) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');

        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);

        $room = $twilio->video->v1->rooms($sid)->fetch();

        $identity = Users::loggedInUser(true)->id . "\t" . time();

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