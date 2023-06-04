<?php

/**
 * Used to close an existing stream. A cron job may delete this stream later.
 *
 * @module Streams
 * @class Streams stream
 * @method delete
 * @static
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.publisherId The id of the stream publisher
 * @param {string} $_REQUEST.streamName The name of the stream the user will be invited to
 */
function Streams_stream_delete($params) {
	$asUserId = Q::ifset($params, "asUserId", null) ?: Users::loggedInUser(true)->id;
	$publisherId = Q::ifset($params, "publisherId", null) ?: Streams::requestedPublisherId(true);
	$streamName = Q::ifset($params, "streamName", null) ?: Streams::requestedName(true);
	
	$stream = Streams_Stream::fetch($asUserId, $publisherId, $streamName, true);
	$close = Streams_Stream::getConfigField($stream->type, 'close', true);
	if (!$close) {
        throw new Q_Exception("This app doesn't let clients directly close streams of type ".$stream->type, 'type');
	}
	
	Streams::$cache['result'] = Streams::close($asUserId, $publisherId, $streamName);
	
	// NOTE: we did not delete the stream. That will have to be done in a cron job like this:
	// // Clean up access
	// $stream->delete();
	// Streams_Access::delete()->where(array(
	// 	'publisherId' => $stream->publisherId,
	// 	'streamName' => $stream->name
	// ))->execute();
	
	Q_Response::setSlot('result', Streams::$cache['result']);
}