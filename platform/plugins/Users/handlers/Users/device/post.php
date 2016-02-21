<?php

function Users_device_post () {

	$user = Users::loggedInUser(true);
	$token = isset($_REQUEST['token']) ? $_REQUEST['token'] : null;
	$platform = Q_Request::platform();
	$version = Q_Request::OSVersion();
	$formFactor = Q_Request::isMobile() ? 'mobile' : (Q_Request::isTablet() ? 'tablet' : null);

	$device = new Users_Device();
	$device->userId = $user->id;
	$device->deviceId = $token;
	$device->platform = $platform;
	$device->version = $version;
	$device->formFactor = $formFactor;
	$device->sessionId = Q_Session::id();

	$_SESSION['Users']['deviceId'] = $token;

	Q_Response::setSlot('data', !!$device->save(true));

	Q_Utils::sendToNode(array(
		"Q/method" => "Users/device",
		"userId" => $user->id,
		"deviceId" => $token
	));

}
