<?php

function Streams_before_Q_sessionExtras()
{
	if (Q_Session::id()) {
		// We have a valid session. Generate a token for observe/neglect resources etc.
		if ($permissions = Q_Config::get('Streams', 'public', 'permissions', null)) {
			Users::capability()->addPermission($permissions);
		}
	}
	$user = Users::loggedInUser(false, false);
	if ($user) {
		Q_Response::setScriptData(
			'Q.plugins.Users.loggedInUser.displayName', 
			Streams::displayName($user)
		);
	}
}
