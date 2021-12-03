<?php
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';


/**
 * Base class for Streams_Webcast
 *
 * @class Streams_Webcast
 */
class Streams_Webcast
{

    /**
     * Fetch Streams/webcast stream and check permissions
     * @method fetchStream
     * @param {string} $publisherId publisher of stream
     * @param {string} $roomId Room Id of room (last part of stream name)
     * @param {string} $resumeClosed Return existing stream if it exist, or create new otherwise
     * @return {array} The keys are "stream", "created", "roomId", "socketServer"
     */
    static function fetchStream($publisherId, $roomId, $resumeClosed) {
        if (!empty($roomId)) {
            $streamName = "Streams/webcast/$roomId";
            $stream = Streams::fetchOne($publisherId, $publisherId, $streamName);
            if (($stream && $resumeClosed) || ($stream && empty($stream->closedTime))) {

                if($resumeClosed) {
                    $stream->closedTime = null;
                    $stream->changed();

                }

                return $stream;
            }
        }

        return null;
    }

    /**
     * Create Streams/webcast stream
     * @method createStream
     * @param {string} $publisherId publisher of stream
     * @param {string} $roomId Room Id of room (last part of stream name)
     * @param {string} $resumeClosed Return existing stream if it exist, or create new otherwise
     * @return {array} The keys are "stream", "created", "roomId", "socketServer"
     */
    static function createStream($publisherId, $roomId, $resumeClosed, $writeLevel) {
        $streamName = null;

        if (!empty($roomId)) {
            $streamName = "Streams/webcast/$roomId";
        }

        $text = Q_Text::get('Streams/content');
        $fields = array();

        $fields['name'] = $streamName;
        $fields['writeLevel'] = $writeLevel;

        $stream = Streams::create($publisherId, $publisherId, 'Streams/webcast', $fields);
        if ($stream) return $stream;


        throw new Q_Exception("Failed during create webcast stream");
    }

    /**
     * Create or fetch Streams/webcast stream
     * @method getOrCreateStream
     * @param {string} $publisherId publisher of stream
     * @param {string} $roomId Room Id of room (last part of stream name)
     * @param {string} $resumeClosed Return existing stream if it exist, or create new otherwise
     * @return {array} The keys are "stream", "created", "roomId", "socketServer"
     */
    static function getOrCreateStream($publisherId, $roomId, $resumeClosed, $writeLevel) {
        $streamName = null;

        if(strpos($roomId, 'Streams/webcast/') !== false) {
            $roomId = explode('/', $roomId)[2];
        }

        $existingRoomStream = self::fetchStream($publisherId, $roomId, $resumeClosed);

        if(!is_null($existingRoomStream)) {
            return $existingRoomStream;
        } else {
            return self::createStream($publisherId, $roomId, $resumeClosed, $writeLevel);
        }

        throw new Q_Exception("Failed during create webcast stream");
    }
};