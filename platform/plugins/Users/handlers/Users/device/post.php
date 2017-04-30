<?php

/**
 * Adds a device to the current user id and session.
 * See Users_Device::add method for more details.
 * @param {string} $deviceId
 * @param {string} $appId external app id registered with the platform
 * @param {string} [$platform=Q_Request::platform()] one of the platforms listed in Users/apps/platforms array
 * @return {void}
 */
function Users_device_post ()
{
	Q_Request::requireFields(array('deviceId'));
	$deviceId = $_REQUEST['deviceId'];
	$appId = $_REQUEST['appId'];
	$user = Users::loggedInUser(true);
	$device = Users_Device::add(array_merge($_REQUEST, array(
		'userId' => $user->id
	)));
	Q_Response::setSlot('data', $device);
}
