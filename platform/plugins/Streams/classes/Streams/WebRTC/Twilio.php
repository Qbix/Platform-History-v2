<?php

/**
 * @module Streams
 */

class Streams_WebRTC_Twilio extends Streams_WebRTC implements Streams_WebRTC_Interface
{
	/**
	 * This class represents WebRTC rooms
	 * @class Streams_WebRTC_Twilio
	 * @constructor
	 * @param {string} $publisherId
	 * @param {string} $roomId
	 * @param {boolean} [$join=true] Whether to join the room also
	 */
    function createRoom($publisherId, $roomId, $join = true) {
        if (empty($publisherId)) {
            throw new Q_Exception_RequiredField(array('field' => 'publisherId'));
        }
        if (!empty($roomId)) {
            $streamName = "Streams/webrtc/$roomId";
            $stream = Streams::fetchOne($publisherId, $publisherId, $streamName);
            if (!$stream) {
                $stream = Streams::create($publisherId, $publisherId, 'Streams/webrtc', array(
                    'name' => $streamName
                ));
            }
        } else {
            $stream = Streams::create($publisherId, $publisherId, 'Streams/webrtc');
            $roomId = substr($stream->name, strlen('Streams/webrtc/'));
        }
        try {
            $twilioRoom = $this->getRoom($twilioRoomName);
        } catch (Exception $e) {
            $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
            $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
            $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
            $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');
            $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);
            $roomUniqueName = "$publisherId-$roomId";
            $twilioRoom = $twilio->video->v1->rooms->create(array("uniqueName" => $roomUniqueName));
        }
		$stream->set('twilioRoom', $twilioRoom);
        $stream->setAttribute('twilioRoomSid', $twilioRoom->sid);
        $stream->setAttribute('twilioRoomName', $twilioRoom->uniqueName);
        $stream->changed();
        return $stream;
    }
    
    function joinRoom($userId, $publisherId, $streamName) {
        $stream = Streams::fetchOne($userId, $publisherId, $streamName);
        $participants = $stream->getParticipants(array(
            "state" => "participating"
        ));
        if (!isset($participants[$userId])) {
            $stream->join();
        } else {
            Streams_Message::post(null, $publisherId, $streamName, array(
                'type' => 'Streams/webrtc/joined'
            ), true);
        }

        $twilioRoomSid = $stream->getAttribute('twilioRoomSid');
        $twilioRoomName = $stream->getAttribute('twilioRoomName');
        if (!$twilioRoomSid) {
            $twilioRoom = $this->createTwilioRoom($stream);
            $stream->setAttribute('twilioRoomSid', $room->id);
            $stream->setAttribute('twilioRoomName', $room->name);
            $stream->changed();
        } else {
            try {
                $twilioRoom = $this->getRoom($twilioRoomName);
            } catch (Exception $e) {
                //die('catch');
                $twilioRoom = $this->createRoom($stream);
                $stream->setAttribute('twilioRoomSid', $room->id);
                $stream->setAttribute('twilioRoomName', $room->name);
                $stream->changed();
            }

        }
		$stream->join();

        //print_r($twilioRoom);die('1213');
        return $stream;
    }

    /**
     * @method getRoom
     * @static
     * @param {string} $$roomIdOrName The twilio roomId or room name
     * @return {Streams_WebRTC_Room|null}
	 * @throws Twilio_Exception
	 */
    function getRoom($sidOrName) {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');
        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);
		try {
			$twilioRoom = $twilio->video->v1->rooms($sidOrName)->fetch();
		} catch (Exception $e) {
			// TODO: test what kind of exception it is,
			// and only do the below if the type is "missing" room
			// otherwise you should re-throw exception
			return null;
		}
		$room = new Streams_WebRTC_Room(array(
			'id' => $twilioRoom->sid,
			'name' => $twilioRoom->uniqueName
		));
        return $room;
    }

    function getAccessToken($sid) {
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