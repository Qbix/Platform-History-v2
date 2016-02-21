<?php

function Users_authorize_post()
{
	if (empty($_REQUEST['authorize'])) {
		return null;
	}

	// If we are here, the logged-in user requested to authorize the client
	$terms_uri = Q_Config::get('Users', 'authorize', 'terms', 'uri', null);
	$terms_label = Q_Config::get('Users', 'authorize', 'terms', 'label', null);
	$terms_title = Q_Config::get('Users', 'authorize', 'terms', 'title', null);
	if ($terms_uri and $terms_title and $terms_label) {
		if (empty($_REQUEST['agree'])) {
			throw new Q_Exception("First you must agree to the $terms_title", 'agree');
		}
	}
	
	$user = Users::loggedInUser(true);

	$client_id = $_REQUEST['client_id'];
	$redirect_url = $_REQUEST['redirect_uri'];
	$state = $_REQUEST['state'];
	// for now we ignore the scope requested and always authorize "user"

	$oa = new Users_OAuth();
	$oa->client_id = $client_id;
	$oa->userId = $user->id;
	$oa->state = $state;
	if ($oa->retrieve()) {
		if ($oa->scope !== 'user' || $oa->redirect_uri !== $redirect_url) {
			throw new Q_Exception("Different parameters were requested with the same state string before", 'state');
		}
		Users::$cache['oAuth'] = $oa;
		return;
	}
	$duration_name = Q_Config::expect('Users', 'authorize', 'duration');
	$duration = Q_Config::expect('Q', 'session', 'durations', $duration_name);
	$access_token = Users::copyToNewSession($duration);
	$oa->scope = 'user'; // for now the scope of authorization is always "user"
	$oa->redirect_uri = $redirect_url; // just saving it
	$oa->access_token = $access_token; // the session token
	$oa->token_expires_seconds = $duration; // session actually expires after $duration seconds of inactivity
	$oa->save();
	
	Q::event('Users/authorize/success', array(
		'oAuth' => $oa,
		'duration' => $duration
	), 'after');

	Users::$cache['oAuth'] = $oa;
}
