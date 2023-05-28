<?php
	
function Users_oauthed_response()
{
	try {
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
		if ($state !== Q_Session::calculateNonce()) {
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
		$result = 'success';
	} catch (Exception $e) {
		Q::log($e, 'Users');
		$result = 'error';
	}
	if (empty($_REQUEST['openWindow'])) {
		Q_Response::redirect($info['finalRedirect']);
		return false;
	}
	echo <<<EOT
<!doctype html><html lang=en>
<head><meta charset=utf-8><title>oAuth</title></head>
<body>
<script type="text/javascript">
window.name = "Q_Users_oAuth_$result";
</script>
</body>
</html>
EOT;
	return false;
}