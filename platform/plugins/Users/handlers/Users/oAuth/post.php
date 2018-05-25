<?php
	
function Users_oAuth_post()
{
	// Validate the inputs
	$fields = array(
		'response_type', 'token_type', 'access_token',
		'expires_in', 'scope', 'state', 'Q_Users_oAuth'
	);
	Q_Request::requireFields($fields, true);
	$fields[] = 'Q_deviceId';
	$params = Q::take($_REQUEST, $fields);
	$params['Q.Users.oAuth'] = $params['Q_Users_oAuth'];
	unset($params['Q_Users_oAuth']);
	Q_Valid::signature(true, $params, array('Q.Users.oAuth'));

	// Set the session id to the access_token
	Q_Session::id($params['access_token']);
	
	// Add a device, if any
	if ($deviceId = Q::ifset($_REQUEST, 'deviceId', null)) {
		$fields2 = array(
			'deviceId', 'platform', 'version', 'formFactor'
		);
		Q_Request::requireFields($fields2);
		$device = Q::take($_REQUEST, $fields2);
		$device['userId'] = Users::loggedInUser(true)->id;
		Users_Device::add($device);
	}
}