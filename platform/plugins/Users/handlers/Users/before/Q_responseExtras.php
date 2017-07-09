<?php

function Users_before_Q_responseExtras()
{
	Q_Response::addScript('plugins/Users/js/Users.js');
	$app = Q_Config::expect('Q', 'app');
	$requireLogin = Q_Config::get('Users', 'requireLogin', array());
	$rl_array = array();
	foreach ($requireLogin as $rl => $value) {
		$rl_array[Q_Uri::url($rl)] = $value;
	}
	if (!Q_Request::isAjax()) {
		Q_Response::setScriptData('Q.plugins.Users.requireLogin', $rl_array);
		$successUrl = Q_Config::get('Users', 'uris', "$app/successUrl", "$app/home");
		$afterActivate = Q_Config::get('Users', 'uris', "$app/afterActivate", $successUrl);
		$loginOptions = Q_Config::get('Users', 'login', array(
			"identifierType" => 'email,mobile', 
			"userQueryUri" => 'Users/user',
			"using" => "native,facebook",
			"noRegister" => false
		));
		$loginOptions["afterActivate"] = Q_Uri::url($afterActivate);
		$loginOptions["successUrl"] = Q_Uri::url($successUrl);
		Q_Response::setScriptData('Q.plugins.Users.login.serverOptions', $loginOptions);
		$setIdentifierOptions = Q::take($loginOptions, array('identifierType'));
		Q_Response::setScriptData('Q.plugins.Users.setIdentifier.serverOptions', $setIdentifierOptions);
	}
	if ($node_server_url = Q_Config::get('Users', 'nodeServer', 'url', null)) {
		Q_Response::setScriptData("Q.plugins.Users.nodeServer", parse_url($node_server_url));
	}
	if (Q_Config::get('Users', 'showLoggedInUser', true)) {
		$user = Q_Session::id() ? Users::loggedInUser() : null;
		if ($user) {
			$u = $user->exportArray();
			$u['sessionCount'] = $user->sessionCount;
			Q_Response::setScriptData("Q.plugins.Users.loggedInUser", $u);
			Q_Response::addScriptLine("Q.plugins.Users.loggedInUser = new Q.plugins.Users.User(Q.plugins.Users.loggedInUser);");
		}
	}
	Q_Response::setScriptData('Q.plugins.Users.communityId', Users::communityId());
	Q_Response::setScriptData('Q.plugins.Users.communityName', Users::communityName());
	Q_Response::setScriptData('Q.plugins.Users.communitySuffix', Users::communitySuffix());
	Q_Response::setScriptData(
		'Q.plugins.Users.hinted',
		Q::ifset($_SESSION, 'Users', 'hinted', array())
	);
	if ($sizes = Q_Config::expect('Users', 'icon', 'sizes')) {
		sort($sizes);
		Q_Response::setScriptData('Q.plugins.Users.icon.sizes', $sizes);
	}
	$defaultSize = Q_Config::get('Users', 'icon', 'defaultSize', 40);
	Q_Response::setScriptData('Q.plugins.Users.icon.defaultSize', $defaultSize);
	Q_Response::addStylesheet("plugins/Users/css/Users.css");
	$platform = Q_Request::platform();
	$browser = Q_Request::browser();
	foreach (array('apps' => $platform, 'browserApps' => $browser) as $k => $v) {
		if (!$v) continue;
		if ($appInfos = Q_Config::get('Users', 'apps', $v, array())) {
			$private = Q_Config::get('Users', 'apps-private', $v, array());
			$apps = array();
			foreach ($appInfos as $appName => $appInfo) {
				$apps[$v][$appName] = $appInfo;
				foreach ($private as $p) {
					unset($apps[$v][$appName][$p]);
				}
				Q_Response::setScriptData("Q.plugins.Users.$k", $apps);
			}
		}
	}

}
