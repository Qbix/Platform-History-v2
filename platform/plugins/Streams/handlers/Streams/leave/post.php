<?php

function Streams_leave_post()
{
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	$streamName = Streams::requestedName(true);
	$streams = Streams::fetch($user->id, $publisherId, $streamName);
	$stream = reset($streams);
	if (empty($streams) or !$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
		));
	}
	$stream->leave(array(), $participant);
	Q_Response::setSlot('participant', $participant->exportArray());
}