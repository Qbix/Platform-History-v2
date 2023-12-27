<?php

function Users_after_Q_analytics()
{
	$url = Q_Request::tail();

	if (Q_Config::get('Q', 'analytics', 'gather', false)) {
		if ((string)Q_Dispatcher::uri() != 'Users/logout') {
			Users_Vote::saveActivity("app", "visited");
			Users_Vote::saveActivity("action", substr($url, 0, 120));
		}
	}
}