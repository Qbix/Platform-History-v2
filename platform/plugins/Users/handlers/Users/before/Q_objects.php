<?php

function Users_before_Q_objects(&$params)
{
	$app = Q::app();

	// We sometimes pass this in the request, for browsers like Safari
	// that don't allow setting of cookies using javascript inside 3rd party iframes
	
	if ($authResponse = Q_Request::special('Users.facebook.authResponse', null)) {
		$appId = Q::ifset($authResponse, 'appId', $app);
		Users_ExternalFrom_Facebook::authenticate($appId);
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
	
	if ($user = Users::loggedInUser(false, false)
	and $user->preferredLanguage
	and Q_Config::get('Users', 'login', 'setLanguage', true)) {
		Q_Text::setLanguage($user->preferredLanguage);
	}

	// If app is in preview mode (for screenshots) and user is not logged in
	if (!$user and Q_Config::get('Users', 'previewMode', false)) {
		// find first valid user and login
		$users = Users_User::select()
			->where(array(
				'signedUpWith !=' => 'none'
			))
			->orderBy('insertedTime', false)
			->limit(1000, 0)
			->fetchDbRows();
		foreach ($users as $user) {
			if (Users::isCommunityId($user->id)) {
				continue;
			}
			Users::setLoggedInUser($user);
			break;
		}
	}
}
