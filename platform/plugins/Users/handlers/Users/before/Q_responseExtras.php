<?php

function Users_before_Q_responseExtras()
{
	Q_Response::addScript('{{Users}}/js/Users.js', 'Users');
	Q_Response::addScript('{{Users}}/js/UsersDevice.js', 'Users');
	$app = Q::app();
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
	Q_Response::addStylesheet("{{Users}}/css/Users.css", 'Users');
	$platforms = array(Q_Request::platform());
	foreach (Q_Config::get('Users', 'apps', 'export', array()) as $platform) {
		$platforms[] = $platform;
	}
	$browsers = array(Q_Request::browser());
	foreach (array('apps' => $platforms, 'browserApps' => $browsers) as $k => $arr) {
		$apps = array();
		foreach ($arr as $platform) {
			$appInfos = Q_Config::get('Users', 'apps', $platform, array());
			if (!$appInfos) continue;
			$private = Q_Config::get('Users', 'apps-private', $platform, array());
			foreach ($appInfos as $appName => $appInfo) {
				$apps[$platform][$appName] = $appInfo;
				foreach($appInfo as $key => $value) {
					if (stristr($key, 'private')) {
						unset($apps[$platform][$appName][$key]);
					}
				}
				foreach ($private as $p) {
					unset($apps[$platform][$appName][$p]);
				}
			}
		}
		//exit;
		Q_Response::setScriptData("Q.plugins.Users.$k", $apps);
	}

}
