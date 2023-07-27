<?php

function Streams_avatar_response()
{
	$prefix = $userIds = $batch = $public = $communities = $platform = null;
	$limit = 10;
	extract($_REQUEST, EXTR_IF_EXISTS);
	$user = Users::loggedInUser();
	$asUserId = $user ? $user->id : "";

	if (isset($prefix)) {
		$options = @compact('limit', 'public', 'communities', 'platform');
		if ($prefix or !$asUserId) {
			$avatars = Streams_Avatar::fetchByPrefix(
				$asUserId, 
				$prefix, 
				$options
			);
		} else {
			$userIds = Users_Contact::fetchUserIds($options);
			$avatars = Streams_Avatar::fetch($asUserId, $userIds);
			$count = count($userIds);
			if ($count < $limit) {
				$limit = $limit - $count;
				$moreAvatars = Streams_Avatar::fetchByPrefix(
					$asUserId, 
					$prefix, 
					$options
				);
				$avatars = array_merge($avatars, $moreAvatars);
			}
		}
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