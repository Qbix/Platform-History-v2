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
}