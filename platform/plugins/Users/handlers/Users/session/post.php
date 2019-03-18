<?php
	
function Users_session_post()
{
	// Validate the inputs
	$fields1 = array('Q.Users.appId', 'Q.Users.newSessionId', 'Q.Users.signature');
	$fields2 = array_merge($fields1, array('Q.Users.deviceId', 'Q.timestamp'));
	$req = Q_Request::fromUnderscores($fields2);
	Q_Valid::requireFields($fields1, $req, true);
	$params = Q::take($req, $fields2);
	$platform = Q_Request::platform();
	list($appId, $info) = Users::appInfo($platform, $params['appId']);
	Q_Valid::signature(true, $params, array('Q.Users.signature'));
	if (isset($params['Q.timestamp'])) {
		$secondsMax = Q_Config::get('Users', 'session', 'redirectSecondsMax');
		if ($params['Q.timestamp'] < time() - $secondsMax) {
			// this is some weird situation where redirect took too long
			throw new Q_Exception("Users/session: $secondsMax exceeded, try again");
		}
	}

	// Seems we just generated this signature.
	// Set the session id to the newSessionId.
	Q_Session::id($params['newSessionId']);
	
	// Add a device, if any
	if ($deviceId = Q::ifset($req, 'Q.Users.deviceId', null)) {
		$user = Users::loggedInUser(true); // throw an exception if user isn't logged in
		$device = Q_Request::userAgentInfo();
		$device['deviceId'] = $deviceId;
		$device['userId'] = $user->id;
		Users_Device::add($device);
	}
}