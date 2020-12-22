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

        $stream = Streams_WebRTC::getOrCreateStream($publisherId, $roomId);

        $endTime = $stream->getAttribute('endTime');
        $startTime = $stream->getAttribute('startTime');
        if($startTime == null || ($endTime != null && round(microtime(true) * 1000) > $endTime)) {

            $stream->setAttribute('startTime', round(microtime(true) * 1000));
            $stream->clearAttribute('endTime');
            $stream->save();
        }

        $socketServerHost = Q_Config::get('Streams', 'webrtc', 'socketServerHost', null);
        $socketServerHost = trim(str_replace('/(http\:\/\/) || (https\:\/\/)/', '', $socketServerHost), '/');
        $socketServerPort = Q_Config::get('Streams', 'webrtc', 'socketServerPort', null);
        if(!empty($socketServerHost) && !empty($socketServerHost)){
            $socketServer = $socketServerHost . ':' . $socketServerPort;
        } else {
            $socketServer = trim(str_replace('/(http\:\/\/) || (https\:\/\/)/', '', Q_Config::get('Q', 'node', 'url', null)), '/');
        }

        $turnServers = Q_Config::get('Streams', 'webrtc', 'turnServers', []);
        $useTwilioTurn = Q_Config::get('Streams', 'webrtc', 'useTwilioTurnServers', null);
        $liveStreamingConfig = Q_Config::get('Streams', 'webrtc', 'liveStreaming', []);
        $debug = Q_Config::get('Streams', 'webrtc', 'debug', false);

        if($useTwilioTurn) {
            try {
                $turnCredentials = $this->getTwilioTurnCredentials();
                $turnServers[] = $turnCredentials;
            } catch (Exception $e) {
            }
        }

        return array(
            'stream' => $stream,
            'roomId' => $stream->name,
            'socketServer' => $socketServer,
            'turnCredentials' => $turnServers,
            'debug' => $debug,
            'options' => array(
                'liveStreaming' => $liveStreamingConfig
            )
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

        if(strpos($roomId, 'Streams/webrtc/') !== false) {
            $roomId = explode('/', $roomId)[2];
        }

        $streamName = "Streams/webrtc/$roomId";
        $stream = Streams::fetchOne($publisherId, $publisherId, $streamName);
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