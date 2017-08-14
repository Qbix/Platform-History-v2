<?php

/**
 * Removes a device from the current user id and session.
 * @param {string} $deviceId
 * @param {string} $appId external app id registered with the platform
 * @param {string} [$platform=Q_Request::browser()||Q_Request::platform()] one of the platforms listed in Users/apps/platforms array
 * @param {string} [$version=Q_Request::OSVersion()] version of the platform
 * @param {string} [$formFactor=Q_Request::formFactor()] the form factor of the platform
 * @return {void}
 */
function Users_device_delete($params = array())
{
	if (Q_Request::requireFields(array('deviceId', 'appId'))) {
		return false;
	}
	$req = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, 'userId', $loggedInUserId);
}