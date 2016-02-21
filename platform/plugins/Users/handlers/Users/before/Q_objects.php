<?php

function Users_before_Q_objects()
{
	$app = Q_Config::expect('Q', 'app');
	$fb_info = Q_Config::get('Users', 'facebookApps', $app, null);

	// We sometimes pass this in the request, for browsers like Safari
	// that don't allow setting of cookies using javascript inside 3rd party iframes
	if (!empty($fb_info['appId']) and !empty($_REQUEST['Users']['facebook_authResponse'])) {
		$appId = $fb_info['appId'];
		$auth_response = $_REQUEST['Users']['facebook_authResponse'];
		if (is_array($auth_response)) {
			if ($auth_response) {
				$cookie = $auth_response['signedRequest'];
				$expires = 0;
			} else {
				$cookie = "";
				$expires = 1;
			}
			try {
				$facebook = new Facebook(array(
					'appId' => $fb_info['appId'], 
					'secret' => $fb_info['secret'],
					'fileUpload' => true
				));
				$cookie_name = 'fbsr_'.$facebook->getAppId();
				if (!empty($_SERVER['HTTP_HOST'])) {
					Q_Response::setCookie($cookie_name, $cookie, $expires);
				}
			} catch (Exception $e) {
				// do nothing
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
}
