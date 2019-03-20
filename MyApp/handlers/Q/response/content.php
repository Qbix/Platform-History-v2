<?php

function Q_response_content()
{
	$app = Q::app();
	$url = Q_Request::url();
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	if (empty($module)) {
		return Q::event("$app/notFound/response/content");
	}
	$action = $uri->action;
	$event = "$module/$action/response/content";
	if (!Q::canHandle($event)) {
		$uri->module = $app;
		$event = "$app/notFound/response/content";
	}
	
	Q_Response::setMeta('format-detection', 'telephone=no,date=no,address=no,email=no,url=no');
		
	// Go ahead and fire the event, returning the result.
	return Q::event($event);
	
}
