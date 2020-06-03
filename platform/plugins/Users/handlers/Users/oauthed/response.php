<?php
	
function Users_oauthed_response()
{
	Q_Request::requireFields(array('state', 'code'), true);
	$state = $_REQUEST['state'];
	$code = $_REQUEST['code'];
	Q_Valid::requireFields(array('Users_oAuth'), $_COOKIE, true);
	$info = Q::json_decode($_COOKIE['Q_Users_oAuth'], true);
	Q_Response::clearCookie('Q_Users_oAuth');
	Q_Valid::requireFields(array(
		'finalRedirect', 'platform', 'appId', 'scope', 'state'
	), $info, true);
	$platform = $info['platform'];
	$appId = $info['appId'];
	$scope = $info['scope'];
	if ($state !== $info['state']) {
		throw new Users_Exception_WrongState(array(
			'key' => 'state',
			'state' => $state
		));
	}
	$appInfo = Users::appInfo($platform, $appId);
	Q_Valid::requireFields(array('authorizeUri', 'tokenUri'), $appInfo, true);
	$authorizeUri = $appInfo['authorizeUri'];
	$tokenUri = $appInfo['tokenUri'];
	$user = Users::loggedInUser(true);
	
	$params = array(
		'grant_type' => 'authorization_code',
		'code' => $code,
		'redirect_uri' => $info['finalRedirect'],
		'client_id' => $appId
	);
	$response = Q_Utils::post($tokenUri, $params);
	$data = Q::json_decode($response, true);
	$to = new Users_ExternalTo(array(
		'userId' => $user->id,
		'platform' => $platform,	
		'appId' => $appId
	));
	$to->retrieve(); // may load existing one
	$to->processAuthorizationCodeResponse($data); // saves it
}