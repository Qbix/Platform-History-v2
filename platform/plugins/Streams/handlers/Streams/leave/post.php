<?php

/**
 * @module Streams
 */

/**
 * Used by HTTP clients to join an existing stream
 * @class HTTP Streams leave
 * @method post
 * @param {array} [$_REQUEST] Parameters that can come from the request
 *   @param {string} $_REQUEST.publisherId  Required. The id of the user to publish the stream.
 *   @param {string} $_REQUEST.streamName Required. The name of the stream.
 */
function Streams_leave_post()
{
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	$streamName = Streams::requestedName(true);
	$stream = Streams_Stream::fetch($user->id, $publisherId, $streamName, true);
	if ($participant = $stream->leave()) {
		Q_Response::setSlot('participant', $participant->exportArray());
	}
}