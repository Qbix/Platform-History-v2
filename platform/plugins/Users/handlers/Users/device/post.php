<?php

/**
 * Adds a device to the current user id and session.
 * See Users_Device::add method for more details.
 * @param {string} $deviceId
 * @return {void}
 */
function Users_device_post ()
{
	Q_Request::requireFields(array('deviceId'));
	$deviceId = $_REQUEST['deviceId'];
	$user = Users::loggedInUser(true);
	$device = Users_Device::add(array_merge($_REQUEST, array(
		'userId' => $user->id
	)));
	Q_Response::setSlot('data', $device);
}
