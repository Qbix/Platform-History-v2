<?php

function Streams_subscribe_post()
{
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	$streamName = Streams::requestedName(true);
	$stream = Streams_Stream::fetch($user->id, $publisherId, $streamName, true);
	// SECURITY: Do not allow client to set options here
	// because then they can set participant extra.
	if ($participant = $stream->subscribe()) {
		Q_Response::setSlot('participant', $participant->exportArray());
	}
}