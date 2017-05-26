<?php

function Streams_join_post()
{
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	$streamName = Streams::requestedName(true);
	$stream = Streams::fetchOne($user->id, $publisherId, $streamName, true);
	// SECURITY: Do not allow client to set options here
	// because then they can set participant extra.
	if ($participant = $stream->join()) {
		Q_Response::setSlot('participant', $participant->exportArray());
	}
}