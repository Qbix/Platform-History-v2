<?php

function Q_response_content()
{		
	$app = Q_Config::expect('Q', 'app');
	$url = Q_Request::url();
	$module = Q_Dispatcher::uri()->module;
	if (empty($module)) {
		return Q::event("$app/notFound/response/content");
	}
	$action = Q_Dispatcher::uri()->action;
	$event = "$module/$action/response/content";
	if (!Q::canHandle($event)) {
		return Q::event("$app/notFound/response/content");
	}
		
	// Go ahead and fire the event, returning the result.
	return Q::event($event);
	
}
