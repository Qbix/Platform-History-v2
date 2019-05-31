<?php


/**
 * @module Streams
 */

class Streams_WebRTC_Node extends Streams_WebRTC implements Streams_WebRTC_Interface
{
    /**
     * This class represents WebRTC rooms
     * @class Streams_WebRTC_Twilio
     * @constructor
     */
    function createRoom($publisherId, $roomId) {
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


        return (object) [
            'stream' => $stream,
            'roomId' => $stream->name,
        ];
    }

}