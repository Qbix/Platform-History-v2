<?php

function Streams_invite_response_content()
{
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $user->id;
	}
	$streamName = Streams::requestedName(true);
	$stream = new Streams_Stream();
	$stream->publisherId = $publisherId;
	$stream->name = $streamName;
	if (!$stream->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
		));
	}
	return Q::tool('Streams/invite', @compact('stream'));
}