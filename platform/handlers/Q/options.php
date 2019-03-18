<?php

function Q_options($params)
{
	$uri = Q_Dispatcher::uri();
	$module = $uri->module;
	$action = $uri->action;
	if (!Q::canHandle("$module/$action/options")) {
		return null;
	}
	return Q::event("$module/$action/options", $params);
}
