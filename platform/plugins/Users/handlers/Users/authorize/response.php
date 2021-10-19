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
	Q_Request::requireFields(array('client_id', 'state'), true);
	$req = Q_Request::fromUnderscores(array('Q.Users.deviceId'));

	$response_type = 'token';
	$token_type = 'bearer';
	$appId = $client_id = $req['client_id'];
	$scope = Users_OAuth::requestedScope($appId, true);
	$remaining = $scope;
	$state = $req['state'];
	$platform = Q_Request::platform();
	list($appId, $info) = Users::appInfo($platform, $appId);
	if (empty($info['baseUrl'])) {
		throw new Q_Exception("Client app must have baseUrl in config", 'client_id');
	}
	if (!empty($info['custom'])
	and $info['custom'] !== Q_Request::customUserAgentString()) {
		throw new Q_Exception("User-Agent string must have Q-custom($info[custom])");
	}
	
	$redirect_uri = Q::ifset($req, 'redirect_uri', $info['baseUrl']);
	if (empty($info['paths'])) {
		throw new Q_Exception("Client app must have paths array in config", 'client_id');
	}
	$paths = $info['paths'];
	$path = substr($redirect_uri, strlen($info['baseUrl'])+1);
	if (!Q::startsWith($redirect_uri, $info['baseUrl'])
	or (is_array($paths) and !in_array($path, $paths))) {
		throw new Users_Exception_Redirect(array('uri' => $redirect_uri));
	}
	$authorize = true;
	$automatic = Q::ifset($appInfo, 'authorize', 'automatic', false);
	$params = @compact(
		'client_id', 'redirect_uri', 'scope', 'scopes', 'remaining',
		'state', 'response_type', 'automatic', 'authorize'
	);
	if ($automatic) {
		Q::event('Users/authorize/post', $params);
	}

	$user = Users::loggedInUser();

	$externalTo = null;
	if (isset(Users::$cache['externalTo'])) {
		$externalTo = Users::$cache['externalTo'];
	} else if ($user) {
		$externalTo = new Users_ExternalTo();
		$externalTo->appId = $appId;
		$externalTo->userId = $user->id;
		$externalTo = $externalTo->retrieve();
	}

	if ($externalTo and $externalTo->wasRetrieved()) {
		// User is logged in and already has a token for this client_id and state
		$p = array(
			'Q.Users.platform' => $platform,
			'Q.Users.appId' => $appId,
			'response_type' => $response_type,
			'token_type' => $token_type,
			'access_token' => $externalTo->accessToken,
			'expires_in' => $externalTo->expires,
			'scope' => implode(' ', $scope),
			'state' => $state
		);
		if (!empty($req['Q.Users.deviceId'])) {
			$p['Q.Users.deviceId'] = $req['Q.Users.deviceId'];
		}
		$p = Q_Utils::sign($p, 'Q.Users.oAuth');
		// the redirect uri could be a native app url scheme
		$redirect_uri = Q_Uri::fixUrl($redirect_uri.'#'.http_build_query($p));
		Q_Response::redirect($redirect_uri);
		return false;
	}

	$terms_label = Users::termsLabel('authorize');
	
	Q_Response::setScriptData('Q.Users.authorize', $params);
	if (isset($req['Q.Users.deviceId'])) {
		$deviceId = $req['Q.Users.deviceId'];
	}
	$content = Q::view('Users/content/authorize.php', @compact(
		'client', 'user', 'redirect_uri',  'scope', 'scopes', 'remaining',
		'state', 'terms_label', 'response_type', 'automatic', 'deviceId'
	));
	Q_Response::setSlot('content', $content);
	Q_Response::setSlot('column0', $content);
	return true;
}
