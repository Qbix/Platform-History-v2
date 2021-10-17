<?php

function Users_device_delete($params = array())
{
	$user = Users::loggedInUser();
	if (!$user) {
		return false;
	}

	$userId = $user->id;
	Q_Request::requireFields(array('deviceId'), true);
	$req = array_merge($_REQUEST, $params);
	$deviceId = Q::ifset($req, 'deviceId', '');
	Db::connect('Users')
		->delete('users_device')
		->where(@compact('userId', 'deviceId'))
		->execute();
}