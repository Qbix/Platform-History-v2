<?php

/**
 * @module Users
 */

/**
 * Used by HTTP clients to know whether device subscribed
 * @param {string} $params.userId
 * @param {string} $params.platform
 * @return {bool} Whether device registered in DB
 */
function Users_device_response_subscribed($params = array())
{
	$userId = Q::ifset($options, 'userId', null);
	$userId = $userId ? $userId : Users::loggedInUser(true)->id;

	try {
		$info = Q_Request::browscap()->getBrowser();
		$browser = strtolower($info->Browser);
	} catch (Exception $e) {
		$browser = Q_Request::browser();
		$version = null;
	}
	if (!Q_Request::isCordova()
		and Q_Config::get('Users', 'apps', $browser, false)) {
		$platform = $browser;
	} else {
		$platform = Q_Request::platform();
	}

	$subscribed = Users_Device::select()
		->where(@compact("userId", "platform"))
		->fetchAll();

	return Q_Response::setSlot('subscribed', !!$subscribed);
}