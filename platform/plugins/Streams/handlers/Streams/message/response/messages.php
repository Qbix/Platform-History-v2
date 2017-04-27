<?php

function Streams_message_response_messages()
{
	if (isset(Streams::$cache['message'])) {
		$message = Streams::$cache['message'];
		return Db::exportArray(array($message->ordinal => $message));
	}
	if (isset(Streams::$cache['messages'])) {
		return Db::exportArray(Streams::$cache['messages']);
	}
	
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$type = Streams::requestedMessageType();
	$withTotals = Q::ifset($_REQUEST, 'withTotals', null);
	if ($withTotals and !is_array($withTotals)) {
		throw new Q_Exception_WrongType(array('withTotals' => 'array'));
	}
	$o = $withTotals ? compact('withTotals') : array();
	$stream = Q::ifset(Streams::$cache, 'stream', 
		Streams::fetchOne(null, $publisherId, $streamName, true, $o)
	);
	if (!$stream->testReadLevel('messages')) {
		throw new Users_Exception_NotAuthorized();
	}
	$maxLimit = Streams_Stream::getConfigField($type, 'getMessagesLimit', 100);
	$limit = min($maxLimit, Q::ifset($_REQUEST, 'limit', $maxLimit));
	if (isset($_REQUEST['ordinal'])) {
		$min = $_REQUEST['ordinal'];
		$limit = 1;
	}
	if (isset($_REQUEST['min'])) {
		$min = $_REQUEST['min'];
	}
	$max = isset($_REQUEST['max']) ? $_REQUEST['max'] : -1;
	if (isset($_REQUEST['ascending'])) {
		$ascending = $_REQUEST['ascending'];
	}
	
	if ($withTotals) {
		Q_Response::setSlot('totals', $stream->get('totals'));
	}

	$messages = $stream->getMessages(compact('type', 'min', 'max', 'limit', 'ascending'));
	return Db::exportArray($messages);
}