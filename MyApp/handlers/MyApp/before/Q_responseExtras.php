<?php

function MyApp_before_Q_responseExtras()
{
	Q_Response::addStylesheet('css/MyApp.css', '@end');
	Q_Response::addScript('js/MyApp.js', 'MyApp');
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
