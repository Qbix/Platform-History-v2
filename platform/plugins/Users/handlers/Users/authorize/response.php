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

	$client_id = $_REQUEST['client_id'];
	$redirect_url = $_REQUEST['redirect_uri'];
	$state = $_REQUEST['state'];

	$client = Users_User::fetch($client_id);
	if (!$client) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'user',
			'criteria' => "id = '$client_id'"
		), 'client_id');
	}
	if (empty($client->url)) {
		throw new Q_Exception("Client app needs to register url", 'client_id');
	}
	if (substr($redirect_url, 0, strlen($client->url)) !== $client->url) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'redirect_uri',
			'range' => "a url prefixed by client user's url"
		));
	}

	$user = Users::loggedInUser();

	$oa = null;
	if (isset(Users::$cache['oAuth'])) {
		$oa = Users::$cache['oAuth'];
	} else if ($user) {
		$oa = new Users_OAuth();
		$oa->client_id = $client_id;
		$oa->userId = $user->id;
		$oa->state = $state;
		$oa->retrieve();
	}

	if ($oa and $oa->wasRetrieved()) {
		// User is logged in and already has a token for this client_id and state
		$separator = (strpos($redirect_url, '?') === false) ? '?' : '&';
		$url = $redirect_url . $separator . http_build_query(array(
			'access_token' => $oa->access_token,
			'token_type' => 'bearer',
			'expires_in' => $oa->token_expires_seconds,
			'scope' => 'user',
			'state' => $oa->state
		));
		Q_Response::redirect(Q_Uri::from($url, false));
		return false;
	}

	$terms_label = Users::termsLabel('authorize');

	$content = Q::view(
		'Users/content/authorize.php',
		compact('client', 'redirect_url', 'user', 'state', 'terms_label')
	);
	Q_Response::setSlot('content', $content);
	Q_Response::setSlot('column0', $content);
	return true;
}
