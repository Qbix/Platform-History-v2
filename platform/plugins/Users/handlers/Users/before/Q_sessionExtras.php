<?php

function Users_before_Q_sessionExtras()
{
	if (Q_Config::get('Users', 'showLoggedInUser', true)) {
		if ($user = Users::loggedInUser(false, false)) {
			$u = $user->exportArray();
			$u['sessionCount'] = $user->sessionCount;
			$u['email'] = $user->emailAddress;
			$u['mobile'] = $user->mobileNumber;
			$u['preferredLanguage'] = $user->preferredLanguage;
			Q_Response::setScriptData("Q.plugins.Users.loggedInUser", $u);
			Q_Response::addScriptLine("Q.plugins.Users.loggedInUser = new Q.plugins.Users.User(Q.plugins.Users.loggedInUser);");
			Users::capability()->addPermission('Users/socket');
			Users::capability()->setData('userId', $user->id);
		}
	}
	Q_Response::setScriptData(
		'Q.plugins.Users.hinted',
		Q::ifset($_SESSION, 'Users', 'hinted', array())
	);
}
