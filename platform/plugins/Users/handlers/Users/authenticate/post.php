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
	$appId = Q::ifset($_REQUEST, 'appId', null);
	$updateXid = filter_var(Q::ifset($_REQUEST, "updateXid", false), FILTER_VALIDATE_BOOLEAN);
	$user = Users::authenticate($platform, $appId, $authenticated, null, $updateXid);
	if (!$user) {
		throw new Users_Exception_NotLoggedIn();
	}
	Users::setLoggedInUser($user);
}
