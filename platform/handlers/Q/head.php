<?php

function Q_post($params)
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	if (!Q::canHandle("$module/$action/head")) {
		throw new Q_Exception_MethodNotSupported(array('method' => 'HEAD'));
	}
	return Q::event("$module/$action/head", $params);
}
