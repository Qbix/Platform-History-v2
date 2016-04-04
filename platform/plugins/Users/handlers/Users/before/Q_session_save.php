<?php

function Users_before_Q_session_save($params)
{
	if (empty($params['row'])) {
		return;
	}
	$row = $params['row'];
	$row->deviceId = "";
	$row->timeout = 0;
	$row->content = isset($_SESSION)
		? Q::json_encode($_SESSION, JSON_FORCE_OBJECT)
		: "{}";
}