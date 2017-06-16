<?php

/**
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.platform Specify the platform to authenticate with
 */
function Users_authenticate_post()
{
	// Authenticate the logged-in user with the platform via the app
	// It will try to important set an email address for the user if one isn't set yet
	Q_Request::requireFields(array('platform'), true);
	$platform = $_REQUEST['platform'];
	$user = Users::authenticate($platform, null, $authenticated);
	if (!$user) {
		throw new Users_Exception_NotLoggedIn();
	}
	Users::setLoggedInUser($user);
}
