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

	Q_Request::requireFields(array('appId', 'redirect'), true);
	$req = Q::take($_REQUEST, array('appId' => null, 'deviceId' => null, 'redirect' => null));
	$platform = Q_Request::platform();
	list($appId, $appInfo) = Users::appInfo($platform, $req['appId'], true);
	
	$redirect = $req['redirect'];
	$baseUrl = Q_Request::baseUrl();
	$scheme = Q::ifset($appInfo, 'scheme', null);
	$paths = Q::ifset($appInfo, 'paths', false);
	if (Q::startsWith($redirect, $baseUrl)) {
		$path = substr($redirect, strlen($baseUrl)+1);
		$path = $path ? $path : '/';
	} else if (Q::startsWith($redirect, $scheme)) {
		$path = substr($redirect, strlen($scheme));
		$path = $path ? $path : '/';
	} else {
		throw new Users_Exception_Redirect(array('uri' => $redirect));
	}
	if (is_array($paths) and !in_array($path, $paths)) {
		throw new Users_Exception_Redirect(array('uri' => $req['redirectUri']));
	}
	
	$duration_name = Q_Request::formFactor();
	$duration = Q_Config::expect('Q', 'session', 'durations', $duration_name);
	$redirectFields = array();
	$sessionFields = Q_Request::userAgentInfo();
	$sessionFields['appId'] = $appInfo['appId'];
	if (isset($req['deviceId'])) {
		$sessionFields['deviceId'] = $req['deviceId'];
		$redirectFields['Q.Users.deviceId'] = $req['deviceId'];
	}
	$newSessionId = Users_Session::copyToNewSession($sessionFields, $duration);
	$redirectFields['Q.Users.newSessionId'] = $newSessionId;
	$redirectFields['Q.Users.appId'] = $appId;
	$redirectFields['Q.timestamp'] = time();
	$redirectFields = Q_Utils::sign($redirectFields, 'Q.Users.signature');
	$qs = http_build_query($redirectFields);
	$url = Q_Uri::fixUrl("$redirect#$qs");

	Q_Response::addScript('{{Users}}/js/pages/session.js', 'Users');
	Q_Response::setScriptData("Q.Cordova.handoff.url", $url);
	//Q_Response::redirect($url, array('noProxy' => true));
	return true;
}