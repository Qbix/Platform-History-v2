<?php

function Websites_before_Q_responseExtras()
{
	$user = Users::loggedInUser(false, false);
	$userId = $user ? $user->id : "";
	$websitesUserId = Users::communityId();
	$sha1 = sha1(Q_Dispatcher::uri());
	$seoStreamName = "Websites/seo/$sha1";
	$streams = Streams::fetch($userId, $websitesUserId, array(
		"Websites/header", "Websites/title", "Websites/slogan", $seoStreamName
	));
	if (!empty($streams[$seoStreamName])) {
		$fields = Q::take(
			$streams[$seoStreamName]->getAllAttributes(),
			array('keywords', 'description')
		);
		foreach ($fields as $k => $v) {
			Q_Response::setMeta($k, $v);
		}
		Q_Response::setSlot('title', $streams[$seoStreamName]->getAttribute('title'));
	}
	foreach ($streams as $name => $s) {
		if ($s) {
			$s->addPreloaded($userId);
		}
	}
	Q_Response::setScriptData('Q.plugins.Websites.seoStreamName', $seoStreamName);
	Q_Response::setScriptData('Q.plugins.Websites.userId', Users::communityId());
	Q_Response::setScriptData('Q.plugins.Websites.seoReload', Q_Config::expect('Websites', 'seoReload'));
}
