<?php

function Users_authenticate_post()
{
	// Authenticate the logged-in user with the platform via the app
	// It will try to set an email address for the user if one isn't set yet
	$user = Users::authenticate('facebook', null, $authenticated);
	if (!$user) {
		throw new Users_Exception_NotLoggedIn();
	}
	Users::setLoggedInUser($user);
}
