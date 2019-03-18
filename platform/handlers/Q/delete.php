<?php

function Q_delete($params)
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	if (!Q::canHandle("$module/$action/delete")) {
		throw new Q_Exception_MethodNotSupported(array('method' => 'DELETE'));
	}
	Q_Request::requireValidNonce();
	return Q::event("$module/$action/delete", $params);
}
