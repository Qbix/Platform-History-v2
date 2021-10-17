<?php

function Users_user_response_batch($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('batch'), $req, true);
	$batch = $req['batch'];
	$batch = json_decode($batch, true);
	if (!isset($batch)) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'batch', 
			'range' => '{userIds: [userId1, userId2, ...]}'
		));
	}
	Q_Valid::requireFields(array('userIds'), $batch, true);
	$userIds = $batch['userIds'];
	$users = Q::event('Users/user/response/users', @compact('userIds'));
	$result = array();
	foreach ($userIds as $userId) {
		$result[] = array('slots' => 
			array('user' => isset($users[$userId]) ? $users[$userId] : null)
		);
	}
	Q_Response::setSlot('batch', $result);
}