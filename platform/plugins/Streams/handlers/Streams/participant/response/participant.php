<?php

function Streams_participant_response_participant()
{
	if (isset(Streams::$cache['participant'])) {
		return Streams::$cache['participant'];
	}

	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	if (empty($_REQUEST['userId'])) {
		throw new Q_Exception_RequiredField(array('field' => 'userId'));
	}

	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	$stream = Streams::fetch($userId, $publisherId, $streamName);
	if (empty($stream)) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'Stream', 
			'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
		));
	}
	$stream = reset($stream);

	if (!$stream->testReadLevel('participants')) {
		throw new Users_Exception_NotAuthorized();
	}
	$p = new Streams_Participant();
	$p->publisherId = $publisherId;
	$p->streamName = $streamName;
	$p->userId = $_REQUEST['userId'];
	if ($p->retrieve()) {
		return $p->exportArray();
	}
	return null;
}