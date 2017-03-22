<?php

function Streams_total_response_totals($options) {
	extract($options);
	$user = Users::loggedInUser();
	$asUserId = $user ? $user->id : "";
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$type = Streams::requestedMessageType();
	$stream = Streams::fetchOne($asUserId, $publisherId, $streamName, true, array(
		'withTotals' => array($streamName => $type)
	));
	return $stream->get('totals');
}