<?php

/**
 * Get rows relating to streams the user is participating in.
 * Can fill slots "streams" and "participating".
 * @param {string} [$type] Actually used as a prefix for the streamName, if specified
 * @param {string|array} [$state] Pass 'invited', 'participating', 'left' to filter by state.
 * @param {string|array} [$subscribed] Pass 'yes' or 'no' to filter by whether user subscribed
 * @param {integer} [$fresh] Pass 0 or 1 to filter by freshness.
 */
function Streams_participating_response()
{
	if(!Q_Request::isAjax()) {
		return;
	}

	$max_limit = Q_Config::expect('Streams', 'db', 'limits', 'participating');
	$max_offset = (Q_Config::expect('Streams', 'db', 'pages') - 1) * $max_limit - 1;

	$user = Users::loggedInUser(true);
	$type = Streams::requestedType();
	$state = Streams::requestedField('state', false, null);
	$subscribed = Streams::requestedField('subscribed', false, null);
	$fresh = Streams::requestedField('fresh', false, null);
	$limit = Streams::requestedField('limit', false, $max_limit);
	if ($limit > $max_limit) {
		throw new Q_Exception("limit is too large, must be <= $max_limit");
	}
	$offset = Streams::requestedField('offset', false, 0);
	if ($offset > $max_limit * $max_pages) {
		throw new Q_Exception("offset is too large, must be <= $max_offset");
	}
	$order = Streams::requestedField('order', false, true);

	$participating = array();
	$q = Streams_Participating::select('*')
		->where(array('userId'=>$user->id));

	if ($type) {
		$q = $q->where(array(
			'streamName' => new Db_Range($type.'/', true, false, true)
		));
	}
	if ($limit) {
		$q = $q->limit($limit, $offset);
	}
	if ($order) {
		$q = $q->orderBy('updatedTime', false);
	}
	if (isset($state)) {
		$q = $q->andWhere(compact('state'));
	}
	if (isset($subscribed)) {
		$q = $q->andWhere(compact('subscribed'));
	}
	if (isset($fresh)) {
		$q = $q->andWhere(compact('fresh'));
	}
		
	$res_participating = $q->fetchDbRows();
	foreach($res_participating as $part) {
		$part_safe = $part->exportArray();
		if (isset($part_safe)) {
			$participating[] = $part_safe;
		}
	}
	Q_Response::setSlot('participating', $participating);

	if (!Q_Request::slotName('streams')) {
		return;
	}

	$res_streams = array();
	$streamNames = array();
	foreach ($res_participating as $p) {
		$streamNames[$p->publisherId][] = $p->streamName;
	}
	foreach ($streamNames as $p_id => $names) {
		$res_streams[$p_id] = Streams::fetch($user->id, $p_id, $names);
	}
	$streams = array();
	$o = array('asUserId' => $user->id);
	foreach ($res_streams as $publisherId => $streams_array) {
		if (!empty($streams_array)) {
			$streams[$publisherId] = array();
			foreach ($streams_array as $streamName => $stream) {
				$streams[$publisherId][$streamName] = $stream->exportArray($o);
			}
		}
	}
	Q_Response::setSlot('streams', $streams);
}