<?php

function Users_before_Q_sessionExtras()
{
	if ($uri = Q_Dispatcher::uri()) {
		if ($permissions = Q_Config::get('Users', 'capability', 'public', $uri->route(), null)) {
			Users::capability()->addPermission($permissions);
		}
		if ($permissions = Q_Config::get('Users', 'capability', 'public', '*', null)) {
			Users::capability()->addPermission($permissions);
		}
	}
	if ($user = Users::loggedInUser(false, false)) {
		if (Q_Config::get('Users', 'showLoggedInUser', true)) {
			$u = $user->exportArray();
			$u['email'] = $user->emailAddress;
			$u['mobile'] = $user->mobileNumber;
			$u['preferredLanguage'] = $user->preferredLanguage;
			Q_Response::setScriptData("Q.plugins.Users.loggedInUser", $u);
		}
		Users::capability()->addPermission('Users/socket');
		Users::capability()->setData('userId', $user->id);
	}
	Q_Response::setScriptData(
		'Q.plugins.Users.hinted',
		Q::ifset($_SESSION, 'Users', 'hinted', array())
	);
	Q_Response::setScriptData(
		'Q.plugins.Users.Session.publicKey',
		Q::ifset($_SESSION, 'Users', 'publicKey', null)
	);
}
