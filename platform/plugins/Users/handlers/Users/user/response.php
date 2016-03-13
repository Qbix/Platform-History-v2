<?php

function Users_user_response($params)
{
	$userIds = Q::ifset($_REQUEST, 'userIds', null);
	$batch = Q::ifset($_REQUEST, 'batch', null);
	
	if ($batch) {
		$batch = json_decode($batch, true);
		if (!isset($batch)) {
			throw new Q_Exception_WrongValue(array('field' => 'batch', 'range' => '{userIds: [userId1, userId2, ...]}'));
		}
		if (!isset($batch['userIds'])) {
			throw new Q_Exception_RequiredField(array('field' => 'userIds'));
		}
		$userIds = $batch['userIds'];
	} else if (!isset($userIds)) {
		return;
	}
	if (is_string($userIds)) {
		$userIds = explode(",", $userIds);
	}
	$fields = Q_Config::expect('Users', 'avatarFields');
	$users = Users_User::select($fields)
		->where(array('id' => $userIds))
		->fetchDbRows(null, null, 'id');
	$users = Db::exportArray($users);
	if (!isset($batch)) {
		Q_Response::setSlot('users', $users);
		return $users;
	}
	if ($batch) {
		$result = array();
		foreach ($userIds as $userId) {
			$result[] = array('slots' => 
				array('user' => isset($users[$userId]) ? $users[$userId] : null)
			);
		}
		Q_Response::setSlot('batch', $result);
	}
	return false;
}