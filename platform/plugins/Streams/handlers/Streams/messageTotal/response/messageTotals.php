<?php

function Streams_messageTotal_response_messageTotals($options) {
	extract($options);
	$user = Users::loggedInUser();
	$asUserId = $user ? $user->id : "";
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$type = Streams::requestedMessageType();
	$stream = Streams::fetchOne($asUserId, $publisherId, $streamName, true, array(
		'withMessageTotals' => array($streamName => $type)
	));
	return $stream->get('messageTotals');
}