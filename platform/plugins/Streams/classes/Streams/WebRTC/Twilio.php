<?php
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Rest\Client;

/**
 * @module Streams
 */

class Streams_WebRTC_Twilio extends Streams_WebRTC implements Streams_WebRTC_Interface
{

	/**
	 * Creates or joins a room
	 * @method getRoomStream
	 * @param {string} $publisherId Id of room's publisher/initiator
	 * @param {string} $roomId Room id in Qbix (last marp of stream name)
	 * @return {array} The keys are "stream", "created", "roomId", "socketServer"
	 * @throws Q_Exception_MissingRow
	 * @throws Q_Exception_RequiredField
	 * @throws Users_Exception_NotAuthorized
	 */
    function getRoomStream($publisherId, $roomId)
    {

        if (empty($publisherId)) {
            throw new Q_Exception_RequiredField(array('field' => 'publisherId'));
        }

		$stream = Streams_WebRTC::getOrCreateStream($publisherId, $roomId);
		$roomId = substr($stream->name, strlen('Streams/webrtc/'));

        try {
            $twilioRoom = $this->getTwilioRoom($roomId, $publisherId);
        } catch (Exception $e) {
            $twilioRoom = $this->createTwilioRoom($roomId, $publisherId);
            $stream->set('twilioRoom', $twilioRoom);
            $stream->setAttribute('twilioRoomSid', $twilioRoom->sid);
            $stream->setAttribute('twilioRoomName', $twilioRoom->uniqueName);
            $stream->changed();
        }

        try {
            $accessToken = $this->getTwilioAccessToken($twilioRoom->sid);
            $stream->setAttribute('accessToken', $accessToken);
            ///$stream->changed();
            //print_r($stream);die;

        } catch(Exception $e) {

        }

		$debug = Q_Config::get('Streams', 'webrtc', 'debug', false);

		return array(
            'stream' => $stream,
            'roomId' => $stream->name,
            'accessToken' => $accessToken,
            'debug' => $debug,
        );
    }

    /**
     * @method getTwilioRoom
     * @static
     * @param {string} $roomIdOrName The twilio roomId or room name
     * @param {string} $roomId Room id in Qbix (last marp of stream name)
     * @return {Object|null}
     * @throws Twilio_Exception
     */
    function getTwilioRoom($publisherId, $roomId) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');
        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);
        $roomUniqueName = "$publisherId-$roomId";

        $twilioRoom = $twilio->video->v1->rooms($roomUniqueName)->fetch();
        return $twilioRoom;
    }

    /**
     * @method getRoom
     * @param {string} $$roomIdOrName The twilio roomId or room name
     * @return {Streams_WebRTC_Room|null}
     * @throws Twilio_Exception
     */
    function createTwilioRoom($publisherId, $roomId) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');
        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);
        $roomUniqueName = "$publisherId-$roomId";

        $twilioRoom = $twilio->video->v1->rooms->create(array("uniqueName" => $roomUniqueName));

        return $twilioRoom;
    }

    /**
     * @method getParticipant Retrieves all participants in the room connected to twilio
     * @param {string} $sid Sid of twilio room
     * @return {Array|null}
     * @throws Twilio_Exception
     */
    function getParticipant($sid) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');

        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);
        $twilioParticipant = $twilio->video->rooms($sid)->participants->read(array("status" => "connected"));

        return $twilioParticipant;
    }

    /**
     * @method getParticipant Generates access token that is used on the client
     * @param {string} $sid Sid of twilio room
     * @return {String|null}
     * @throws Twilio_Exception
     */
    function getTwilioAccessToken($sid) {
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

}