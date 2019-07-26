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
	 * @method createOrJoinRoom
	 * @param {string} $publisherId Id of room's publisher/initiator
	 * @param {string} $roomId Room id in Qbix (last marp of stream name)
	 * @return {Object}
	 */
    function createOrJoinRoom($publisherId, $roomId) {
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

		$stream->setAttribute('startTime', time());
		$stream->changed();

		$socketServer = Q_Config::get('Streams', 'webrtc', 'socketServer', null);

        return (object) [
            'stream' => $stream,
            'roomId' => $stream->name,
            'socketServer' => $socketServer
		];
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