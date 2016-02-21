<?php

function Users_avatar_response($params)
{
	$userIds = $batch = null;
	extract($_REQUEST, EXTR_IF_EXISTS);
	
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
		throw new Q_Exception_RequiredField(array('field' => 'userIds'), 'userIds');
	}
	if (is_string($userIds)) {
		$userIds = explode(",", $userIds);
	}
	$fields = Q_Config::expect('Users', 'avatarFields');
	$users = Users_User::select($fields)
		->where(array('id' => $userIds))
		->fetchDbRows(null, null, 'id');
	$avatars = Db::exportArray($users);
	if (!isset($batch)) {
		Q_Response::setSlot('avatars', $avatars);
		return $avatars;
	}
	if ($batch) {
		$result = array();
		foreach ($userIds as $userId) {
			$result[] = array('slots' => 
				array('avatar' => isset($avatars[$userId]) ? $avatars[$userId] : null)
			);
		}
		Q_Response::setSlot('batch', $result);
	}
	return $avatars;
}