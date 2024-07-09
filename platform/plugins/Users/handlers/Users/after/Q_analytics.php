<?php

function Users_after_Q_metrics()
{
	$url = Q_Request::tail();

	if (Q_Config::get('Q', 'metrics', 'gather', false)) {
		if ((string)Q_Dispatcher::uri() != 'Users/logout') {
			Users_Vote::saveActivity("app", "visited");
			Users_Vote::saveActivity("action", substr($url, 0, 120));
		}
	}
}