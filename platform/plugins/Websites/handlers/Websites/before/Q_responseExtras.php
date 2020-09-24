<?php

function Websites_before_Q_responseExtras()
{
	$user = Users::loggedInUser(false, false);
	$userId = $user ? $user->id : "";
	$websitesUserId = Users::communityId();
	$sha1 = sha1(Q_Dispatcher::uri());
	$seoStreamName = "Websites/seo/$sha1";
	$stream = Streams::fetchOne($userId, $websitesUserId, $seoStreamName);
	if ($stream) {
		$fields = Q::take(
			$stream->getAllAttributes(),
			array('keywords', 'description')
		);
		foreach ($fields as $k => $v) {
			Q_Response::setMeta($k, $v);
		}
		Q_Response::setSlot('title', $stream->getAttribute('title'));
	}
	Q_Response::addStylesheet('{{Websites}}/css/Websites.css', 'Websites');
	Q_Response::addScript('{{Websites}}/js/Websites.js', 'Websites');
	Q_Response::setScriptData('Q.plugins.Websites.seoStreamName', $seoStreamName);
	Q_Response::setScriptData('Q.plugins.Websites.userId', Users::communityId());
	Q_Response::setScriptData('Q.plugins.Websites.seoReload', Q_Config::expect('Websites', 'seoReload'));
    Q_Response::setScriptData('Q.plugins.Websites.videoHosts', Q_Config::get('Websites', 'videoHosts', array()));
    Q_Response::setScriptData('Q.plugins.Websites.videoExtensions', Q_Config::get('Websites', 'videoExtensions', array()));
    Q_Response::setScriptData('Q.plugins.Websites.audioHosts', Q_Config::get('Websites', 'audioHosts', array()));
    Q_Response::setScriptData('Q.plugins.Websites.audioExtensions', Q_Config::get('Websites', 'audioExtensions', array()));
}
