<?php

/**
 * @module Streams
 */

/**
 * Used by HTTP clients to fetch relations and related streams
 * @class HTTP Streams related
 * @method get
 * @param {array} [$_REQUEST] Parameters that can come from the request
 *   @param {string} $_REQUEST.publisherId  Required. The user id of the publisher of the stream.
 *   @param {string} $_REQUEST.streamName  Required streamName or name. The name of the stream
 *   @param {string|array} $_REQUEST.type The type of the relation(s)
 *   @param {boolean} [$_REQUEST.isCategory=false] Whether to fetch streams related TO the stream with this publisherId and streamName.
 *   @param {boolean} [$_REQUEST.relationsOnly=false] Return only the relations, not the streams
 *   @param {boolean} [$_REQUEST.ascending=false] Whether to sort by ascending instead of descending weight
 *   @param {boolean} [$_REQUEST.omitRedundantInfo=false] Whether to omit redundant publisherId and streamName fields in the output
 *   @param {integer} [$_REQUEST.messages=0] Whether to also return this many latest messages per stream
 *   @param {string} [$_REQUEST.messageType] The type of messages to get
 *   @param {string|array} $_REQUEST.type The type of the relation(s)
 *   @param {integer} [$_REQUEST.participants=0] Whether to also return this many participants per stream
 */
function Streams_related_response()
{
	if (!Q_Request::slotName('relations') and !Q_Request::slotName('streams')) {
		return;
	}
	
	$user = Users::loggedInUser();
	$asUserId = $user ? $user->id : '';
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true, 'original');
	$isCategory = !(empty($_REQUEST['isCategory']) or strtolower($_REQUEST['isCategory']) === 'false');
	$slotNames = Q_Request::slotNames();
	$streams_requested = in_array('relatedStreams', $slotNames);
	$withParticipant = Q::ifset($_REQUEST, 'withParticipant', true) === "false" ? false : true;
	$options = Q::take($_REQUEST, array(
		'limit', 'offset', 'min', 'max', 'type', 'prefix', 'filter'
	));
	$options['relationsOnly'] = !$streams_requested;
	$options['orderBy'] = filter_var($_REQUEST['ascending'], FILTER_VALIDATE_BOOLEAN);
	$options['fetchOptions'] = @compact('withParticipant');
	$result = Streams::related(
		$asUserId,
		$publisherId,
		$streamName,
		$isCategory,
		$options
	);

	$fields = Q::ifset($_REQUEST, 'fields', null);
	$exportOptions = array('numeric' => true);
	if (isset($fields)) {
		if (is_string($fields)) {
			$fields = array_map('trim', explode(',', $fields));
		}
		$exportOptions['fields'] = $fields;
	}
	if ($streams_requested) {
		$rel = Db::exportArray($result[0], $exportOptions);
	} else {
		$rel = Db::exportArray($result, $exportOptions);
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

	if ($streams_requested) {
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
	}

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
			$type = Q::ifset($_REQUEST, 'messageType', null);
			$messages = Db::exportArray($stream->getMessages(
				@compact('type', 'max', 'limit')
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
				@compact('limit', 'offset')
			));
		}
		Q_Response::setSlot('participants', $participants);
	}
}
