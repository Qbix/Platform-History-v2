<?php

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
			$fields ? $fields : '*');
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
				$app = Q_Config::expect('Q', 'app');
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
	$stream->set('participant', $stream->getParticipant());
	if (Q_Request::slotName('stream')) {
		Q_Response::setSlot('stream', $stream->exportArray());
	}
	if (!empty($_REQUEST['messages'])) {
		$max = -1;
		$limit = $_REQUEST['messages'];
		$messages = false;
		$type = isset($_REQUEST['messageType']) ? $_REQUEST['messageType'] : null; 
		if ($stream->testReadLevel('messages')) {
			$messages = Db::exportArray($stream->getMessages(compact('type', 'max', 'limit')));
		}
		Q_Response::setSlot('messages', $messages);
	}
	if (!empty($_REQUEST['participants'])) {
		$limit = $_REQUEST['participants'];
		$participants = false;
		if ($stream->testReadLevel('participants')) {
			$participants = Db::exportArray($stream->getParticipants(compact('limit', 'offset')));
		}
		Q_Response::setSlot('participants', $participants);
	}
}