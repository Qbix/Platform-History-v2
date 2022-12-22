<?php

function Websites_before_Q_responseExtras()
{
	$user = Users::loggedInUser(false, false);
	$userId = $user ? $user->id : "";
	$websitesUserId = Users::communityId();
	$sha1 = sha1(Q_Dispatcher::uri());
	$metadataStreamName = "Websites/metadata/$sha1";
	$stream = Streams_Stream::fetch($userId, $websitesUserId, $metadataStreamName);
	if ($stream) {
		$fields = Q::take(
			$stream->getAllAttributes(),
			array('keywords', 'description')
		);
		foreach ($fields as $k => $v) {
			Q_Response::setMeta(array(
				'name' => 'name',
				'value' => $k,
				'content' => $v
			));
		}
		Q_Response::setSlot('title', $stream->getAttribute('title'));
	}
	Q_Response::addStylesheet('{{Websites}}/css/Websites.css', 'Websites');
	Q_Response::addScript('{{Websites}}/js/Websites.js', 'Websites');
	Q_Response::setScriptData('Q.plugins.Websites.metadataStreamName', $metadataStreamName);
	Q_Response::setScriptData('Q.plugins.Websites.userId', Users::communityId());
	Q_Response::setScriptData('Q.plugins.Websites.metadataReload', Q_Config::expect('Websites', 'metadataReload'));
    Q_Response::setScriptData('Q.plugins.Websites.videoHosts', Q_Config::get('Websites', 'videoHosts', array()));
    Q_Response::setScriptData('Q.plugins.Websites.videoExtensions', Q_Config::get('Websites', 'videoExtensions', array()));
    Q_Response::setScriptData('Q.plugins.Websites.audioHosts', Q_Config::get('Websites', 'audioHosts', array()));
    Q_Response::setScriptData('Q.plugins.Websites.audioExtensions', Q_Config::get('Websites', 'audioExtensions', array()));
}
