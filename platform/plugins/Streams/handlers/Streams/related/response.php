<?php

function Streams_related_response()
{
	if (!Q_Request::slotName('relations') and !Q_Request::slotName('streams')) {
		return;
	}
	
	$user = Users::loggedInUser();
	$asUserId = $user ? $user->id : '';
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true, 'original');
	$isCategory = !empty($_REQUEST['isCategory']);
	$slotNames = Q_Request::slotNames();
	$streams_requested = in_array('relatedStreams', $slotNames);
	$options = array(
		'relationsOnly' => !$streams_requested,
		'orderBy' => !empty($_REQUEST['ascending']),
		'fetchOptions' => array('withParticipant' => true)
	);
	if (isset($_REQUEST['limit'])) $options['limit'] = $_REQUEST['limit'];
	if (isset($_REQUEST['offset'])) $options['offset'] = $_REQUEST['offset'];
	if (isset($_REQUEST['min'])) $options['min'] = $_REQUEST['min'];
	if (isset($_REQUEST['max'])) $options['max'] = $_REQUEST['max'];
	if (isset($_REQUEST['type'])) $options['type'] = $_REQUEST['type'];
	if (isset($_REQUEST['prefix'])) $options['prefix'] = $_REQUEST['prefix'];
	$result = Streams::related(
		$asUserId,
		$publisherId,
		$streamName,
		$isCategory,
		$options
	);

	if ($streams_requested) {
		$rel = Db::exportArray($result[0], array('numeric' => true));
	} else {
		$rel = Db::exportArray($result, array('numeric' => true));
	}

	if (!empty($_REQUEST['omitRedundantInfo'])) {
		if ($isCategory) {
			foreach ($rel as &$r) {
				unset($r['toPublisherId']);
				unset($r['toStreamName']);
			}
		} else {
			foreach ($rel as &$r) {
				unset($r['fromPublisherId']);
				unset($r['fromStreamName']);
			}
		}
	}

	Q_Response::setSlot('relations', $rel);
	if (!$streams_requested) {
		return;
	}

	$streams = $result[1];
	$arr = Db::exportArray($streams, array('numeric' => true));
	foreach ($arr as $k => $stream) {
		if (!$stream) continue;
		$s = $streams[$stream['name']];
		$arr[$k]['access'] = array(
			'readLevel' => $s->get('readLevel', $s->readLevel),
			'writeLevel' => $s->get('writeLevel', $s->writeLevel),
			'adminLevel' => $s->get('adminLevel', $s->adminLevel)
		);
	}
	Q_Response::setSlot('relatedStreams', $arr);
	
	$stream = $result[2];
	if (is_array($stream)) {
		Q_Response::setSlot('streams', Db::exportArray($stream));
		return;
	} else if (is_object($stream)) {
		Q_Response::setSlot('stream', $stream->exportArray());
	} else {
		Q_Response::setSlot('stream', false);
	}
	
	if (!empty($_REQUEST['messages'])) {
		$max = -1;
		$limit = $_REQUEST['messages'];
		$messages = false;
		$type = isset($_REQUEST['messageType']) ? $_REQUEST['messageType'] : null;
		if ($stream->testReadLevel('messages')) {
			$messages = Db::exportArray($stream->getMessages(
				compact('type', 'max', 'limit')
			));
		}
		Q_Response::setSlot('messages', $messages);
	}
	if (!empty($_REQUEST['participants'])) {
		$limit = $_REQUEST['participants'];
		$offset = -1;
		$participants = false;
		if ($stream->testReadLevel('participants')) {
			$participants = Db::exportArray($stream->getParticipants(
				compact('limit', 'offset')
			));
		}
		Q_Response::setSlot('participants', $participants);
	}
}
