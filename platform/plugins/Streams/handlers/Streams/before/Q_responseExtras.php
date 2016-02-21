<?php

function Streams_before_Q_responseExtras()
{
	Q_Response::addScript('plugins/Streams/js/Streams.js');

	$host = Q_Config::get('Streams', 'node', 'host', Q_Config::get('Q', 'node', 'host', null));
	$port = Q_Config::get('Streams', 'node', 'port', Q_Config::get('Q', 'node', 'port', null));
	$user = Users::loggedInUser();
	if ($user) {
		Q_Response::setScriptData('Q.plugins.Users.loggedInUser.displayName', Streams::displayName($user));
	}
	if (!Q_Request::isAjax()) {
		$invite_url = Q_Config::get('Streams', 'invite', 'url', "http://invites.to");
		Q_Response::setScriptData('Q.plugins.Streams.invite.url', $invite_url);
		if (isset($host) && isset($port)) {
			Q_Response::setScriptData('Q.plugins.Streams.node', array("http://$host:$port"));
		}
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
	}
	Q_Response::addStylesheet("plugins/Streams/css/Streams.css");
}
