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
	 * @method createOrJoinRoom
	 * @param {string} $publisherId Id of room's publisher/initiator
	 * @param {string} $roomId Room id in Qbix (last marp of stream name)
	 * @return {array} The keys are "stream", "created", "roomId", "socketServer"
	 */
    function createOrJoinRoom($publisherId, $roomId) {
        if (empty($publisherId)) {
            throw new Q_Exception_RequiredField(array('field' => 'publisherId'));
        }

        $created = false;
        if (!empty($roomId)) {
            $streamName = "Streams/webrtc/$roomId";
            $stream = Streams::fetchOne($publisherId, $publisherId, $streamName);
            if (!$stream) {
                $stream = Streams::create($publisherId, $publisherId, 'Streams/webrtc', array(
                    'name' => $streamName
                ));
                $created = true;
            }
        } else {
            $stream = Streams::create($publisherId, $publisherId, 'Streams/webrtc');
            $roomId = substr($stream->name, strlen('Streams/webrtc/'));
            $created = true;
        }

		$stream->setAttribute('startTime', time());
		$stream->changed();

		$webrtcHost = Q_Config::get('Streams', 'webrtc', 'socketServerHost', null);
		$appHost = Q_Config::get('Q', 'node', 'host', null);
		$socketServerHost = $webrtcHost ? $webrtcHost : $appHost;
		$socketServerPort = Q_Config::get('Streams', 'webrtc', 'socketServerPort', null);
		if(!empty($socketServerHost) && !empty($socketServerHost)){
			$socketServer = $socketServerHost . ':' . $socketServerPort;
		}

		$turnServers = Q_Config::get('Streams', 'webrtc', 'turnServers', []);
		$useTwilioTurn = Q_Config::get('Streams', 'webrtc', 'useTwilioTurnServers', null);

		if($useTwilioTurn) {
			try {
				$turnCredentials = $this->getTwilioTurnCredentials();
				$turnServers[] = $turnCredentials;
			} catch (Exception $e) {
			}
		}

        return array(
            'stream' => $stream,
	        'created' => $created,
            'roomId' => $stream->name,
            'socketServer' => $socketServer,
            'turnCredentials' => $turnServers
        );
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

		$streamName = "Streams/webrtc/$roomId";
		$stream = Streams::fetchOne($publisherId, $publisherId, $streamName);
		$stream->setAttribute('endTime', time());
		$stream->changed();

        return (object) [
            'stream' => $stream,
            'roomId' => $stream->name
		];
    }

    function getTwilioTurnCredentials() {
        return parent::getTwilioTurnCredentials();
    }

}