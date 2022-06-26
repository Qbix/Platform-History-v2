<?php

/**
 * @module Streams
 */

/**
 * Used by HTTP clients to join an existing stream
 * @class HTTP Streams join
 * @method post
 * @param {array} [$_REQUEST] Parameters that can come from the request
 *   @param {string} $_REQUEST.publisherId  Required. The id of the user to publish the stream.
 *   @param {string} $_REQUEST.streamName Required. The name of the stream.
 */
function Streams_join_post()
{
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	$streamName = Streams::requestedName(true);
	$stream = Streams_Stream::fetch($user->id, $publisherId, $streamName, true);
	// SECURITY: Do not allow client to set options here
	// because then they can set participant extra.
	$participant = null;
	try {
		$participant = $stream->join();
	} catch (Exception $e) {

	}

	if ($participant) {
		Q_Response::setSlot('participant', $participant->exportArray());
	} else {
		Q_Response::setSlot('participant', array());
	}

}