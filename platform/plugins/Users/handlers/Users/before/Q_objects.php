<?php

function Users_before_Q_objects(&$params)
{
	$app = Q_Config::expect('Q', 'app');
	$fb_infos = Q_Config::get('Users', 'apps', 'facebook', array());

	// We sometimes pass this in the request, for browsers like Safari
	// that don't allow setting of cookies using javascript inside 3rd party iframes
	
	$authResponse = Q_Request::special('Users.facebook.authResponse', null);
	$appId = Q::ifset($authResponse, 'appId', $app);
	$fbAppId = Q::ifset($authResponse, 'fbAppId', null);
	if ($fbAppId) {
		$fbAppId = $fb_info['appId'];
		if (is_array($authResponse)) {
			if ($authResponse) {
				$accessToken = $authResponse['accessToken'];
				$cookie = $authResponse['signedRequest'];
				$expires = 0;
			} else {
				$accessToken = null;
				$cookie = "";
				$expires = 1;
			}
			$cookie_name = 'fbsr_'.$fb_info['appId'];
			if (!empty($_SERVER['HTTP_HOST'])) {
				Q_Response::setCookie($cookie_name, $cookie, $expires);
			}
		}
	}

	$uri = Q_Dispatcher::uri();
	$actions = array('activate' => true);
	if ($uri->module === 'Users' and isset($actions[$uri->action])) {
		Q::event("Users/{$uri->action}/objects");
	}
	
	// Fire an event for hooking into, if necessary
	Q::event('Users/objects', array(), 'after');
	
	if (Q_Dispatcher::uri()->facebook) {
		Q_Dispatcher::skip('Q/post');
	}
}
