<?php

function Streams_before_Q_responseExtras()
{
	Q_Response::addScript('{{Streams}}/js/Streams.js', 'Streams');

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
		if ($sizes = Q_Config::expect('Streams', 'types', 'Streams/image', 'sizes')) {
			sort($sizes);
			Q_Response::setScriptData('Q.plugins.Streams.image.sizes', $sizes);
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
}
