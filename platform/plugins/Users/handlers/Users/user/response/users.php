<?php

function Users_user_response_users($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('userIds'), $req, true);
	$userIds = $req['userIds'];
	if (is_string($userIds)) {
		$userIds = explode(",", $userIds);
	}
	$fields = Q_Config::expect('Users', 'avatarFields');
	$users = Users_User::select($fields)
		->where(array('id' => $userIds))
		->fetchDbRows(null, null, 'id');
	return Q_Response::setSlot('users', Db::exportArray($users, array('asAvatar' => true)));
}