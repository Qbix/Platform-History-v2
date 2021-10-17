<?php

function Streams_avatar_response()
{
	$prefix = $limit = $userIds = $batch = $public = null;
	extract($_REQUEST, EXTR_IF_EXISTS);
	$user = Users::loggedInUser();
	$asUserId = $user ? $user->id : "";

	if (isset($prefix)) {
		$avatars = Streams_Avatar::fetchByPrefix(
			$asUserId, 
			$prefix, 
			@compact('limit', 'public')
		);
	} else {
		if (isset($batch)) {
			$batch = json_decode($batch, true);
			if (!isset($batch)) {
				throw new Q_Exception_WrongValue(array('field' => 'batch', 'range' => '{userIds: [userId1, userId2, ...]}'));
			}
			if (!isset($batch['userIds'])) {
				throw new Q_Exception_RequiredField(array('field' => 'userIds'));
			}
			$userIds = $batch['userIds'];
		}
		if (!isset($userIds)) {
			throw new Q_Exception_RequiredField(array('field' => 'userIds'));
		}
		if (is_string($userIds)) {
			$userIds = explode(",", $userIds);
		}
		$avatars = Streams_Avatar::fetch($asUserId, $userIds);
	}

	$avatars = Db::exportArray($avatars);
	if (isset($batch)) {
		$result = array();
		foreach ($userIds as $userId) {
			$result[] = array('slots' =>
				array('avatar' => isset($avatars[$userId]) ? $avatars[$userId] : null)
			);
		}
		Q_Response::setSlot('batch', $result);
	} else {
		Q_Response::setSlot('avatars', $avatars);
	}
	return $avatars;
}