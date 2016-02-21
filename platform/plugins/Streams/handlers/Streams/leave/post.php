<?php

function Streams_leave_post()
{
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	$streamName = Streams::requestedName(true);
	$streams = Streams::fetch($user->id, $publisherId, $streamName);
	if (empty($streams)) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
		));
	}
	$stream = reset($streams);
	$stream->leave(array(), $participant);
	Q_Response::setSlot('participant', $participant->exportArray());
}