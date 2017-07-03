<?php

function Users_before_Q_session_save($params)
{
	if (empty($params['row'])) {
		return;
	}
	$row = $params['row'];
	$user = Users::loggedInUser(false, false);
	$userId = $user ? $user->id : null;
	if (Q::ifset($row, 'userId', null) !== $userId) {
		$row->userId = $userId;
	}
	$row->content = isset($_SESSION)
		? Q::json_encode($_SESSION, JSON_FORCE_OBJECT)
		: "{}";
	if (!$row->wasRetrieved()) {
		$row->deviceId = "";
		$row->timeout = 0;
	}
}