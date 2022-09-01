<?php

function MyApp_notFound_response_content($params)
{
    $url = Q_Request::url();
	$uri = Q_Dispatcher::uri();
	$uri->module = 'MyApp';
	$uri->action = 'notFound';
	if (Q_Request::isAjax()) {
		throw new Q_Exception_NotFound(@compact('url'));
	}
	Q_Dispatcher::uri()->action = 'notFound';
    return Q::view("MyApp/content/notFound.php", @compact('url'));
}

