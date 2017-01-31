<?php

/**
 * We are going to implement a subset of the OAuth 1.0a functionality for now,
 * and later we can expand it to match the full OAuth specification.
 */
function Users_authorize_response()
{
	if (Q_Response::getErrors()) {
		Q_Dispatcher::showErrors();
	}

	$response_type = 'token';
	$token_type = 'bearer';
	$client_id = $_REQUEST['client_id'];
	$scope = Users_OAuth::requestedScope($client_id, true, $scopes);
	$remaining = $scope;
	$state = $_REQUEST['state'];
	$client = Users_User::fetch($client_id, true);
	if (empty($client->url)) {
		throw new Q_Exception("Client app needs to register url", 'client_id');
	}
	$redirect_uri = Q::ifset($_REQUEST, 'redirect_uri', $client->url);
	$paths = Q_Config::get('Users', 'authorize', 'clients', $client_id, 'paths', false);
	$path = substr($redirect_uri, strlen($client->url)+1);
	if (!Q::startsWith($redirect_uri, $client->url)
	or (is_array($paths) and !in_array($path, $paths))) {
		throw new Users_Exception_Redirect(array('uri' => $redirect_uri));
	}
	$authorize = true;
	$automatic = Q_Config::get('Users', 'authorize', 'clients', $client_id, 'automatic', false);
	$params = compact(
		'client_id', 'redirect_uri', 'scope', 'scopes', 'remaining',
		'state', 'response_type', 'automatic', 'authorize'
	);
	if ($automatic) {
		Q::event('Users/authorize/post', $params);
	}

	$user = Users::loggedInUser();

	$oa = null;
	if (isset(Users::$cache['oAuth'])) {
		$oa = Users::$cache['oAuth'];
	} else if ($user) {
		$oa = new Users_OAuth();
		$oa->client_id = $client_id;
		$oa->userId = $user->id;
		$oa = $oa->retrieve();
	}

	if ($oa and $oa->wasRetrieved()) {
		// User is logged in and already has a token for this client_id and state
		$p = array(
			'response_type' => $response_type,
			'token_type' => $token_type,
			'access_token' => $oa->access_token,
			'expires_in' => $oa->token_expires_seconds,
			'scope' => implode(' ', $scope),
			'state' => $state
		);
		if (!empty($_REQUEST['Q_deviceId'])) {
			$p['Q_deviceId'] = $_REQUEST['Q_deviceId'];
		}
		$p = Q_Utils::sign($p, 'Q.Users.oAuth');
		// the redirect uri could be a native app url scheme
		$redirect_uri = Q_Uri::fixUrl($redirect_uri.'#'.http_build_query($p));
		Q_Response::redirect($redirect_uri);
		return false;
	}

	$terms_label = Users::termsLabel('authorize');
	
	Q_Response::setScriptData('Q.Users.authorize', $params);
	if (isset($_REQUEST['Q_deviceId'])) {
		$deviceId = $_REQUEST['Q_deviceId'];
	}
	$content = Q::view('Users/content/authorize.php', compact(
		'client', 'user', 'redirect_uri',  'scope', 'scopes', 'remaining',
		'state', 'terms_label', 'response_type', 'automatic', 'deviceId'
	));
	Q_Response::setSlot('content', $content);
	Q_Response::setSlot('column0', $content);
	return true;
}
