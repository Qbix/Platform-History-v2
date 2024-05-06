<?php

function Streams_before_Q_sessionExtras()
{
	$user = Users::loggedInUser(false, false);
	if ($user) {
		Q_Response::setScriptData(
			'Q.plugins.Users.loggedInUser.displayName', 
			Streams::displayName($user)
		);
	}
}
