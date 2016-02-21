<?php

function Q_validate($params)
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	if (!Q::canHandle("$module/$action/validate")) {
		return null;
	}
	return Q::event("$module/$action/validate", $params);
}
