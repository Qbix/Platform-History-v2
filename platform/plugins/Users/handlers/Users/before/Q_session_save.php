<?php

function Users_before_Q_session_save($params)
{
	$row = $params['row'];
	$row->deviceId = "";
	$row->timeout = 0;
	$row->content = isset($_SESSION)
		? Q::json_encode($_SESSION, JSON_FORCE_OBJECT)
		: "{}";
	$row->duration = Q_Config::get(
		'Q', 'session', 'durations', Q_Request::formFactor(),
		Q_Config::expect('Q', 'session', 'durations', 'session')
	);
}