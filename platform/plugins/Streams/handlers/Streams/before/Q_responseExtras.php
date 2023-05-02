<?php

function Streams_before_Q_responseExtras()
{
	Q_Response::addScript('{{Streams}}/js/Streams.js', 'Streams');

	if (!Q_Request::isAjax()) {
		$invite_url = Q_Config::get('Streams', 'invite', 'url', "https://invites.to");
		Q_Response::setScriptData('Q.plugins.Streams.invite.url', $invite_url);
		if ($sizes = Q_Image::getSizes('Streams/image', $maxStretch)) {
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
	Q_Response::setScriptData('Q.plugins.Streams.notifications.notices', Q_Config::get(
		"Streams", "notifications", "notices", null
	));

	// collect url for all stream types and return to client
	$types = Q_Config::get("Streams", "types", array());
	$typeUrls = array();
	foreach ($types as $type => $data) {
		if (!isset($data['url'])) {
			continue;
		}
		$typeUrls[$type] = $data['url'];
	}
	Q_Response::setScriptData('Q.plugins.Streams.urls', $typeUrls);

	// allowed related streams
	Q_Response::setScriptData('Q.plugins.Streams.chat.allowedRelatedStreams', Q_Config::get("Streams", "chat", "allowedRelatedStreams", null));

	// min amount of interests needed to show "Search interests"
	Q_Response::setScriptData('Q.plugins.Streams.interests.minInterests', Q_Config::get("Streams", "interests", "minInterests", null));
}
