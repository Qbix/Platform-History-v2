<?php

/**
 * Users/session page to be loaded in browsertab / AuthenticationSession
 */
function Users_session_response_content()
{
	$user = Users::loggedInUser();
	if (!$user) {
		return Q::view('Users/content/session.php');
	}

	$url = Users_Session::createAndGenerateRedirectUrl();

	Q_Response::addScript('{{Users}}/js/pages/session.js', 'Users');
	Q_Response::setScriptData("Q.Cordova.handoff.url", $url);
	//Q_Response::redirect($url, array('noProxy' => true));
	return true;
}