<?php

function Streams_message_response_message()
{
	if (isset(Streams::$cache['message']) && gettype(Streams::$cache['message']) == 'object') {
		if (method_exists(Streams::$cache['message'], "exportArray")) {
			return Streams::$cache['message']->exportArray();
		}
		return Streams::$cache['message'];
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
		: Streams_Stream::fetch($userId, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'Stream', 
			'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
		));
	}
	if (!$stream->testReadLevel('messages')) {
		throw new Users_Exception_NotAuthorized();
	}
	$messages = $stream->getMessages(@compact('type', 'min', 'limit'));
	$streamType = $stream->type;
	$messageCount = $stream->messageCount;
	Q_Response::setSlot('extras', compact(
		'publisherId', 'streamName', 'streamType', 'messageCount'
	));
	return !empty($messages) ? reset($messages)->exportArray() : null;
}