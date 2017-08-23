<?php

/**
 * Adds a device to the current user id and session.
 * See Users_Device::add method for more details.
 * @param {string} $deviceId
 * @param {string} $appId external app id registered with the platform
 * @param {string} [$platform=Q_Request::browser()||Q_Request::platform()] one of the platforms listed in Users/apps/platforms array
 * @param {string} [$version=Q_Request::OSVersion()] version of the platform
 * @param {string} [$formFactor=Q_Request::formFactor()] the form factor of the platform
 * @return {void}
 */
function Users_device_post ()
{
	if (Q_Request::requireFields(array('deviceId', 'appId'))) {
		return false;
	}
	$deviceId = $_REQUEST['deviceId'];
	$appId = $_REQUEST['appId'];
	$user = Users::loggedInUser(true);
	try {
		// NOTE: this requires http://browscap.org to be operating
		$info = Q_Request::browscap()->getBrowser();
		$browser = strtolower($info->Browser);
		$version = $info->Version;
	} catch (Exception $e) {
		$browser = Q_Request::browser();
		$version = null;
	}
	if (!Q_Request::isCordova()
	and Q_Config::get('Users', 'apps', $browser, false)) {
		$platform = $browser;
	} else {
		$platform = Q_Request::platform();
		$version = Q_Request::OSVersion();
	}
	$device = Users_Device::add(array_merge(
		array(
			'platform' => $platform,
			'version' => Q_Request::OSVersion(),
			'formFactor' => Q_Request::formFactor()
		),
		$_REQUEST,
		array('userId' => $user->id)
	));
	Q_Response::setSlot('data', $device);
}
