<?php

function Users_after_Q_analytics()
{
	$url = Q_Request::tail();

	if ((string)Q_Dispatcher::uri() != 'Users/logout') {
		Users_Vote::saveActivity("app", "visited");
		Users_Vote::saveActivity("page", substr($url, 0, 120));
	}
}