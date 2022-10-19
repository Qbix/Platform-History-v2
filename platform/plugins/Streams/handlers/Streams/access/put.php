<?php

function Streams_access_put($params)
{
	$user = Users::loggedInUser(true);
	Q_Valid::nonce(true);

	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$stream = Streams_Stream::fetch($user->id, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table'    => 'stream',
			'criteria' => 'with that name'
		));
	}
	if (!$stream->testAdminLevel('own')) {
		throw new Users_Exception_NotAuthorized();
	}
	$p = array_merge($_REQUEST, $params);
	$access = new Streams_Access();
	$access->publisherId = $stream->publisherId;
	$access->streamName = $stream->name;
	$access->ofUserId = Q::ifset($_REQUEST, 'ofUserId', '');
	$access->ofContactLabel = Q::ifset($_REQUEST, 'ofContactLabel', '');
	if (empty($access->ofUserId) and empty($access->ofContactLabel)) {
		$fields = array('grantedByUserId', 'filter', 'readLevel', 'writeLevel', 'adminLevel', 'permissions');
		foreach ($fields as $field) {
			if (isset($p[$field])) {
				$stream->$field = $p[$field];
			}
		}
		$stream->save();
		return;
	}
	//remove fields from where clause
	unset($access->readLevel);
	unset($access->writeLevel);
	unset($access->adminLevel);
	$access->retrieve();
	$fields = array('grantedByUserId', 'filter', 'readLevel', 'writeLevel', 'adminLevel', 'permissions');
	foreach ($fields as $field) {
		if (isset($p[$field])) {
			$access->$field = $p[$field];
		}
	}
	$defaults = array(
		'grantedByUserId' => $user->id,
		'readLevel' => -1,
		'writeLevel' => -1,
		'adminLevel' => -1
	);
	foreach ($defaults as $k => $v) {
		if (!isset($access->$k)) {
			$access->$k = $v;
		}
	}
	$access->save();
	Streams::$cache['access'] = $access;
}