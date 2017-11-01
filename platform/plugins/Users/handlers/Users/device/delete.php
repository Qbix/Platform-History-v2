<?php

function Users_device_delete($params = array())
{
	if (Q_Request::requireFields(array('deviceId', 'appId'))) {
		return false;
	}
	$req = array_merge($_REQUEST, $params);
	$userId = Users::loggedInUser(true)->id;
	$deviceId = Q::ifset($req, 'deviceId', '');
	Db::connect('Users')
		->delete('users_device')
		->where(compact('userId', 'deviceId'))
		->execute();
}