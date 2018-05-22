<?php

function Users_device_delete($params = array())
{
	Q_Request::requireFields(array('deviceId'));

	$req = array_merge($_REQUEST, $params);
	$userId = Users::loggedInUser(true)->id;
	$deviceId = Q::ifset($req, 'deviceId', '');
	Db::connect('Users')
		->delete('users_device')
		->where(compact('userId', 'deviceId'))
		->execute();
}