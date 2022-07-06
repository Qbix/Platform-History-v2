<?php

/**
 * @module Streams
 */

/**
 * Get message totals for one stream
 * @class HTTP Streams messageTotal
 * @method get
 * @param {array} [$_REQUEST] Parameters that can come from the request
 *   @param {string} $_REQUEST.publisherId  Required. The user id of the publisher of the stream.
 *   @param {string} $_REQUEST.streamName  Required streamName or name. The name of the stream
 *   @param {array} $_REQUEST.messageType An array of message types or "*"
 */
function Streams_messageTotal_response_messageTotals($options) {
	extract($options);
	$user = Users::loggedInUser();
	$asUserId = $user ? $user->id : "";
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$type = Streams::requestedMessageType();
	$stream = Streams_Stream::fetch($asUserId, $publisherId, $streamName, true, array(
		'withMessageTotals' => array($streamName => $type)
	));
	return $stream->get('messageTotals');
}