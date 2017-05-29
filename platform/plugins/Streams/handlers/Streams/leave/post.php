<?php

function Streams_leave_post()
{
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	$streamName = Streams::requestedName(true);
	$stream = Streams::fetchOne($user->id, $publisherId, $streamName, true);
	if ($participant = $stream->leave()) {
		Q_Response::setSlot('participant', $participant->exportArray());
	}
}