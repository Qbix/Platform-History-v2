<?php

function Users_after_Q_analytics()
{
	$url = Q_Request::tail();

	Users_Vote::saveActivity("app", "visited");
	Users_Vote::saveActivity("page", substr($url, 120));
}