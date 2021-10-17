<?php

/**
 * Used to get a stream
 *
 * @param {array} $_REQUEST 
 * @param {string} $_REQUEST.publisherId Required
 * @param {string} $_REQUEST.streamName Required streamName or name
 * @param {integer} [$_REQUEST.messages] optionally pass a number here to fetch latest messages
 * @param {integer} [$_REQUEST.participants] optionally pass a number here to fetch participants
 * @return {void}
 */
function Streams_stream_response()
{
	// this handler is only for GET requests
	if (Q_Request::method() !== 'GET') {
		return null;
	}
	
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	$fields = Streams::requestedFields();

	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";

	if (isset(Streams::$cache['stream'])) {
		$stream = Streams::$cache['stream'];
	} else {
		$streams = Streams::fetch(
			$userId,
			$publisherId,
			$name,
			$fields ? $fields : '*',
			array('withParticipant' => true)
		);
		if (Q_Request::slotName('streams')) {
			Q_Response::setSlot('streams', Db::exportArray($streams));
		}
		if (empty($streams)) {
			if (Q_Request::slotName('stream')) {
				Q_Response::setSlot('stream', null);
				Q_Response::setSlot('messages', null);
				Q_Response::setSlot('participants', null);
				Q_Response::setSlot('related', null);
				Q_Response::setSlot('relatedTo', null);
			} else if (!Q_Request::slotName('streams')) {
				$app = Q::app();
				Q_Dispatcher::forward("$app/notFound");
			}
			return null;
		}
		// The rest of the data is joined only on the first stream
		Streams::$cache['stream'] = $stream = reset($streams);
	}
	if (empty($stream)) {
		if (Q_Request::slotName('stream')) {
			Q_Response::setSlot('stream', null);
		}
		return null;
	}
	if ($userId && !empty($_REQUEST['join'])) {
		$stream->join(); // NOTE: one of the rare times we may change state in a response handler
	}
	if (Q_Request::slotName('stream')) {
		Q_Response::setSlot('stream', $stream->exportArray());
	}
	if (!empty($_REQUEST['messages'])) {
		$max = -1;
		$limit = $_REQUEST['messages'];
		$messages = false;
		$type = isset($_REQUEST['messageType']) ? $_REQUEST['messageType'] : null; 
		if ($stream->testReadLevel('messages')) {
			$messages = Db::exportArray($stream->getMessages(@compact('type', 'max', 'limit')));
		}
		Q_Response::setSlot('messages', $messages);
	}
	if (!empty($_REQUEST['participants'])) {
		$limit = $_REQUEST['participants'];
		$offset = 0;
		$state = 'participating';
		$participants = false;
		if ($stream->testReadLevel('participants')) {
			$participants = Db::exportArray($stream->getParticipants(@compact(
				'limit', 'offset', 'state'
			)));
		}
		Q_Response::setSlot('participants', $participants);
	}
}