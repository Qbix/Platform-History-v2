<?php

function Users_before_Q_responseExtras()
{
	Q_Response::addScript('{{Users}}/js/Users.js', 'Users');
	Q_Response::addScript('{{Users}}/js/UsersDevice.js', 'Users');
	$app = Q::app();
	Q_Response::setScriptData("Q.plugins.Users.signatures", 
		Q_Config::get('Users', 'signatures', array())
	);
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
			"using" => "native,web3,facebook",
			"noRegister" => false
		));
		$loginOptions["afterActivate"] = Q_Uri::url($afterActivate);
		$loginOptions["successUrl"] = Q_Uri::url($successUrl);
		Q_Response::setScriptData('Q.plugins.Users.login.serverOptions', $loginOptions);
		$setIdentifierOptions = Q::take($loginOptions, array('identifierType'));
		Q_Response::setScriptData('Q.plugins.Users.setIdentifier.serverOptions', $setIdentifierOptions);
	}
	Q_Response::setScriptData('Q.plugins.Users.communityId', Users::communityId());
	Q_Response::setScriptData('Q.plugins.Users.communityName', Users::communityName());
	Q_Response::setScriptData('Q.plugins.Users.communitySuffix', Users::communitySuffix());
	Q_Response::setScriptData('Q.plugins.Users.currentCommunityId', Users::currentCommunityId());
	if ($sizes = Q_Image::getSizes('Users/icon', $maxStretch)) {
		ksort($sizes);
		Q_Response::setScriptData('Q.plugins.Users.icon.sizes', $sizes);
		Q_Response::setScriptData('Q.plugins.Users.icon.maxStretch', $maxStretch);
	}
	$defaultSize = Q_Image::getDefaultSize('Users/icon');
	Q_Response::setScriptData('Q.plugins.Users.icon.defaultSize', $defaultSize);
	Q_Response::addStylesheet("{{Users}}/css/Users.css", 'Users');
	$platforms = array(Q_Request::platform());
	foreach (Q_Config::get('Users', 'apps', 'export', array()) as $platform) {
		$platforms[] = $platform;
	}
	$platforms = array_unique($platforms);
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
					if (substr($key, -8) == '-private') {
						unset($apps[$platform][$appName][$key]);
					}
				}
				foreach ($private as $p) {
					unset($apps[$platform][$appName][$p]);
				}
			}
		}
		Q_Response::setScriptData("Q.plugins.Users.$k", $apps);
	}

	// add apple signIn js lib
	if (Q_Request::platform() === 'ios') {
		Q_Response::addScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js', 'Users');
	}

	// fetch labels info
	Q_Response::setScriptData("Q.plugins.Users.labels", Users_Label::getLabels());

	// load ethers js libs if web3 config defined
	if ($config = Q_Config::get("Users", "apps", "web3", null)) {
		Q_Response::addScript('{{Users}}/js/web3/ethers-5.2.umd.min.js', 'Users');
		Q_Response::addScript('{{Users}}/js/web3/evm-chains.min.js', 'Users');
		if (Q::ifset($config, Users::communityId(), "providers", "fortmatic", null)) {
			Q_Response::addScript('{{Users}}/js/web3/fortmatic.js', 'Users');
		}
		if (Q::ifset($config, Users::communityId(), "providers", "portis", null)) {
			Q_Response::addScript('{{Users}}/js/web3/portis.js', 'Users');
		}
		Q_Response::addScript('{{Users}}/js/web3/walletconnect.min.js', 'Users');
		Q_Response::addScript('{{Users}}/js/web3/web3.min.js', 'Users');
		Q_Response::addScript('{{Users}}/js/web3/web3modal.js', 'Users');
	}
}
