<?php

function Q_put($params)
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	if (!Q::canHandle("$module/$action/put")) {
		throw new Q_Exception_MethodNotSupported(array('method' => 'PUT'));
	}
	Q_Request::requireValidNonce();
	return Q::event("$module/$action/put", $params);
}
