<?php
	
function Users_oAuth_post()
{
	// Validate the inputs
	$req = Q_Request::fromUnderscores(array(
		'Q.Users.oAuth', 'Q.Users.platform', 'Q.Users.appId'
	));
	$fields = array(
		'response_type', 'token_type', 'access_token',
		'expires_in', 'scope', 'state',
		'Q.Users.oAuth', 'Q.Users.platform', 'Q.Users.appId'
	);
	Q_Valid::requireFields($fields, $req, true);
	$fields[] = 'Q.Users.deviceId';
	$params = Q::take($req, $fields);
	
	$platform = Q::ifset($params, 'Q.Users.platform', Q_Request::platform());
	$appId = Q::ifset($params, 'Q.Users.appId', Q::app());
	list($appId, $info) = Users::appInfo($platform, $appId);
	$info = Users::appInfo($platform, $appId);
	if (empty($info['secret'])) {
		throw new Q_Exception("Client app must have secret in config", 'client_id');
	}
	Q_Valid::signature(true, $params, array('Q.Users.oAuth'), $info['secret']);

	// Set the session id to the access_token
	Q_Session::id($params['access_token']);
	
	// Add a device, if any
	if ($deviceId = Q::ifset($req, 'Q.Users.deviceId', null)) {
		$fields2 = array(
			'deviceId', 'platform', 'version', 'formFactor'
		);
		Q_Request::requireFields($fields2);
		$device = Q::take($req, $fields2);
		$device['userId'] = Users::loggedInUser(true)->id;
		Users_Device::add($device);
	}
}