<?php

/**
 * TODO: DOCUMENT THIS
 */
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

	$appId = $params['client_id'];
	$redirect_uri = $params['redirect_uri'];
	$state = $params['state'];
	
	$platform = Q_Request::platform();
	list($appId, $info) = Users::appInfo($platform, $appId);
	$scope = implode(' ', Users_OAuth::requestedScope($appId, true));
	
	$client = Users_User::fetch($appId, true);
	$paths = Q::ifset($info, 'paths', false);
	$path = substr($redirect_uri, strlen($client->url)+1);
	if (!Q::startsWith($redirect_uri, $client->url)
	or (is_array($paths) and !in_array($path, $paths))) {
		throw new Users_Exception_Redirect(array('uri' => $redirect_uri));
	}
	
	$externalTo = new Users_ExternalTo();
	$externalTo->platform = $platform;
	$externalTo->appId = $appId;
	$externalTo->userId = $user->id;
	if ($externalTo->retrieve()) {
		Users::$cache['externalTo'] = $externalTo;
		return;
	}
	$duration_name = Q_Config::expect('Users', 'authorize', 'duration');
	$duration = Q_Config::expect('Q', 'session', 'durations', $duration_name);
	$sessionFields = Q_Request::userAgentInfo();
	$sessionFields['appId'] = $appId;
	if (isset($_REQUEST['deviceId'])) {
		$sessionFields['deviceId'] = $_REQUEST['deviceId'];
	}
	$accessToken = Users_Session::copyToNewSession($sessionFields, $duration);
	$externalTo->$accessToken = $accessToken; // the session token
	$externalTo->token_expires_seconds = $duration; // session actually expires after $duration seconds of inactivity
	$externalTo->save();
	
	Q::event('Users/authorize/success', @compact('externalTo', 'duration'), 'after');

	Users::$cache['externalTo'] = $externalTo;
}
