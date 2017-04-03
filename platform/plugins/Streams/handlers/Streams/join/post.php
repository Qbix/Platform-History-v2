<?php

function Streams_join_post()
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
	if ($participant = $stream->join($options)) {
		Q_Response::setSlot('participant', $participant->exportArray());
	}
}