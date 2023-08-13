<?php

function Users_before_Q_sessionExtras()
{
	if ($user = Users::loggedInUser(false, false)) {
		if (Q_Config::get('Users', 'showLoggedInUser', true)) {
			$u = $user->exportArray();
			$u['sessionCount'] = $user->sessionCount;
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
