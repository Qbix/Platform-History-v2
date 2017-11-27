<?php

function MyApp_before_Q_responseExtras()
{
	$app = Q::app();	
	
	Q_Response::addStylesheet('{{Q}}/css/Q.css', 'Q');
	Q_Response::addStylesheet('css/MyApp.css', 'MyApp');

	if (Q_Config::get('Q', 'firebug', false)) {
		Q_Response::addScript("https://getfirebug.com/firebug-lite-debug.js", 'Q');
	}
	Q_Response::addScript('js/MyApp.js', 'Q');
	
	if (Q_Request::isIE()) {
		header("X-UA-Compatible", "IE=edge");
	}
	header('Vary: User-Agent');

	Q_Response::addStylesheet('https://fonts.googleapis.com/css?family=Open+Sans:400italic,400,300,700', 'MyApp');
	
	// running an event for loading action-specific extras (if there are any)
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	$event = "$module/$action/response/responseExtras";
	if (Q::canHandle($event)) {
		Q::event($event);
	}
}
