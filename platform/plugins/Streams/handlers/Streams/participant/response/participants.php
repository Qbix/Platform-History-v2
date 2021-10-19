<?php

function Streams_participant_response_participants()
{
	if (isset(Streams::$cache['participant'])) {
		$participant = Streams::$cache['participant'];
		return Db::exportArray(array($participant->userId => $participant));
	}

	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$limit = isset($_REQUEST['limit']) ? $_REQUEST['limit'] : 10;
	$offset = isset($_REQUEST['offset']) ? $_REQUEST['offset'] : -1;
	$state = isset($_REQUEST['state']) ? $_REQUEST['state'] : null;

	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	$stream = Streams::fetchOne($userId, $publisherId, $streamName);
	if (empty($stream)) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'Stream', 
			'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
		));
	}

	if (!$stream->testReadLevel('participants')) {
		throw new Users_Exception_NotAuthorized();
	}

	$participants = $stream->getParticipants(@compact('limit', 'offset', 'state'));
	return Db::exportArray($participants);
}
