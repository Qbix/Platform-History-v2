<?php

function Users_authorize_post($params = array())
{
	$params = array_merge($_REQUEST, $params);
	if (empty($params['authorize'])) {
		return null;
	}

	// If we are here, the logged-in user requested to authorize the client
	$terms_uri = Q_Config::get('Users', 'authorize', 'terms', 'uri', null);
	$terms_label = Q_Config::get('Users', 'authorize', 'terms', 'label', null);
	$terms_title = Q_Config::get('Users', 'authorize', 'terms', 'title', null);
	if ($terms_uri and $terms_title and $terms_label) {
		if (empty($params['agree'])) {
			throw new Q_Exception("First you must agree to the $terms_title", 'agree');
		}
	}
	
	$user = Users::loggedInUser(true);

	$client_id = $params['client_id'];
	$redirect_uri = $params['redirect_uri'];
	$state = $params['state'];
	$scope = implode(' ', Users_OAuth::requestedScope($client_id, true));
	
	$client = Users_User::fetch($client_id, true);
	$paths = Q_Config::get('Users', 'authorize', 'clients', $client_id, 'paths', false);
	$path = substr($redirect_uri, strlen($client->url)+1);
	if (!Q::startsWith($redirect_uri, $client->url)
	or (is_array($paths) and !in_array($path, $paths))) {
		throw new Users_Exception_Redirect(array('uri' => $redirect_uri));
	}
	
	$oa = new Users_OAuth();
	$oa->client_id = $client_id;
	$oa->userId = $user->id;
	if ($oa->retrieve()) {
		if ($oa->scope !== $scope || $oa->redirect_uri !== $redirect_uri) {
			throw new Q_Exception("Different parameters were requested with the same state string before", 'state');
		}
		Users::$cache['oAuth'] = $oa;
		return;
	}
	$duration_name = Q_Config::expect('Users', 'authorize', 'duration');
	$duration = Q_Config::expect('Q', 'session', 'durations', $duration_name);
	$sessionFields = Q_Request::userAgentInfo();
	$platform = Q_Request::platform();
	list($appId, $appInfo) = Users::appInfo($platform, $client_id);
	$sessionFields['appId'] = $appInfo['appId'];
	if (isset($_REQUEST['deviceId'])) {
		$sessionFields['deviceId'] = $_REQUEST['deviceId'];
	}
	$access_token = Users_Session::copyToNewSession($sessionFields, $duration);
	$oa->scope = $scope;
	$oa->redirect_uri = $redirect_uri; // just saving it
	$oa->access_token = $access_token; // the session token
	$oa->token_expires_seconds = $duration; // session actually expires after $duration seconds of inactivity
	$oa->save();
	
	Q::event('Users/authorize/success', array(
		'oAuth' => $oa,
		'duration' => $duration
	), 'after');

	Users::$cache['oAuth'] = $oa;
}
