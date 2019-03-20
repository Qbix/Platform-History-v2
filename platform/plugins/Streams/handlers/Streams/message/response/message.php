<?php

function Streams_message_response_message()
{
	if (isset(Streams::$cache['message'])) {
		return Streams::$cache['message']->exportArray();
	}

	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	if (empty($_REQUEST['ordinal'])) {
		throw new Q_Exception_RequiredField(array('field' => 'ordinal'));
	}
	$min = $_REQUEST['ordinal'];
	$limit = 1;

	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	$stream = isset(Streams::$cache['stream'])
		? Streams::$cache['stream']
		: Streams::fetchOne($userId, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'Stream', 
			'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
		));
	}
	if (!$stream->testReadLevel('messages')) {
		throw new Users_Exception_NotAuthorized();
	}
	$messages = $stream->getMessages(compact('type', 'min', 'limit'));
	return !empty($messages) ? reset($messages)->exportArray() : null;
}