<?php
	
function Users_session_put($params, &$fieldsToClear)
{
	// Validate the inputs
	$field = 'Q_Users_Session_capability';
	Q_Request::requireFields(array($field), true);
	$fieldsToClear = array($field);

	// The following can throw an exception
	$capability = Q_Capability::unserialize($_REQUEST[$field]);
	Q_Valid::requireFields($capability->data, array('newSessionId'), true);

	// Seems our server recently signed this capability.
	// Set the session id to the newSessionId.
	if (Q_Session::id() != $capability->data['newSessionId']) {
		Q_Session::destroy();
		Q_Session::start(false, $capability->data['newSessionId']);
	}

	// Add a device, if any
	if ($deviceId = Q::ifset($capability->data, 'deviceId', null)) {
		$user = Users::loggedInUser(true); // throw an exception if user isn't logged in
		$device = Q_Request::userAgentInfo();
		$device['deviceId'] = $deviceId;
		$device['userId'] = $user->id;
		$device['appId'] = Q::ifset($capability->data, 'appId', Q::app());
		Users_Device::add($device);
	}
	
	// Set new variables in the client Javascript, etc.
	Q_Response::processSessionExtras('before');
	Q_Response::processSessionExtras('after');
}