<?php

function Streams_before_Q_responseExtras()
{
	Q_Response::addScript('{{Streams}}/js/Streams.js', 'Streams');
	Q_Response::addScript('{{Streams}}/js/WebRTC.js' , 'Streams');

	$user = Users::loggedInUser();
	if ($user) {
		Q_Response::setScriptData(
			'Q.plugins.Users.loggedInUser.displayName', 
			Streams::displayName($user)
		);
	}
	if (!Q_Request::isAjax()) {
		$invite_url = Q_Config::get('Streams', 'invite', 'url', "http://invites.to");
		Q_Response::setScriptData('Q.plugins.Streams.invite.url', $invite_url);
		if ($sizes = Q_Image::getSizes('Streams/image', $maxStretch)) {
			ksort($sizes);
			Q_Response::setScriptData('Q.plugins.Streams.image.sizes', $sizes);
			Q_Response::setScriptData('Q.plugins.Streams.image.maxStretch', $maxStretch);
		}
		$defaults = array(
			'readLevel' => Streams::$READ_LEVEL['messages'],
			'writeLevel' => Streams::$WRITE_LEVEL['join'],
			'adminLevel' => Streams::$ADMIN_LEVEL['invite']
		);
		Q_Response::setScriptData('Q.plugins.Streams.defaults', $defaults);
		if ($froalaKey = Q_Config::get('Streams', 'froala', 'key', null)) {
			Q_Response::setScriptData('Q.plugins.Streams.froala.key', $froalaKey);
		}
	}
	Q_Response::addStylesheet("{{Streams}}/css/Streams.css", 'Streams');
	Q_Response::setScriptData('Q.plugins.Streams.notifications.notices', Q_Config::get("Streams", "notifications", "notices", null));

	// collect url for all stream types and return to client
	$types = Q_Config::get("Streams", "types", array());
	$typeUrls = array();
	foreach($types as $type => $content) {
		if (!isset($content['url'])) {
			continue;
		}

		$typeUrls[$type] = $content['url'];
	}
	Q_Response::setScriptData('Q.plugins.Streams.urls', $typeUrls);
}
