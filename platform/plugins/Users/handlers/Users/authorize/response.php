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
	$state = $_REQUEST['state'];
	$skip = Q::ifset($_REQUEST, 'skip', false);
	$scope = Users_OAuth::requestedScope(true, $scopes);
	$client = Users_User::fetch($client_id, true);
	if (!$client) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'client user',
			'criteria' => "id = '$client_id'"
		), 'client_id');
	}
	if (empty($client->url)) {
		throw new Q_Exception("Client app needs to register url", 'client_id');
	}
	$redirect_uri = Q::ifset($_REQUEST, 'redirect_uri', $client->url);

	$user = Users::loggedInUser();

	$oa = null;
	if (isset(Users::$cache['oAuth'])) {
		$oa = Users::$cache['oAuth'];
	} else if ($user) {
		$oa = new Users_OAuth();
		$oa->client_id = $client_id;
		$oa->userId = $user->id;
		$oa->state = $state;
		$oa = $oa->retrieve();
	}

	$remaining = $scope;
	if ($oa and $oa->wasRetrieved()) {
		// User is logged in and already has a token for this client_id and state
		$paths = Q_Config::get('Users', 'authorize', 'clients', Q::app(), 'redirectPaths', false);
		$path = substr($redirect_uri, strlen($client->url)+1);
		$p = array(
			'response_type' => $response_type,
			'token_type' => $token_type,
			'access_token' => $oa->access_token,
			'expires_in' => $oa->token_expires_seconds,
			'scope' => implode(' ', $scope),
			'state' => $oa->state
		);
		$p = Q_Utils::sign($p, 'Q.Users.oAuth');
		// the redirect uri could be a native app url scheme
		$s = (strpos($redirect_uri, '#') === false) ? '#' : '&';
		$redirect_uri = Q_Uri::from($redirect_uri.$s.http_build_query($p), false)->toUrl();
		if (!Q::startsWith($redirect_uri, $client->url)
		or (is_array($paths) and !in_array($path, $paths))) {
			throw new Users_Exception_Redirect(array('uri' => $redirect_uri));
		}
		Q_Response::redirect($redirect_uri);
		return false;
	}

	$terms_label = Users::termsLabel('authorize');
	
	Q_Response::setScriptData('Q.Users.authorize', compact(
		'client_id', 'redirect_uri', 'scope', 'scopes', 'remaining',
		'state', 'response_type', 'skip'
	));
	$content = Q::view('Users/content/authorize.php', compact(
		'client', 'user', 'redirect_uri',  'scope', 'scopes', 'remaining',
		'state', 'terms_label', 'response_type', 'skip'
	));
	Q_Response::setSlot('content', $content);
	Q_Response::setSlot('column0', $content);
	return true;
}
