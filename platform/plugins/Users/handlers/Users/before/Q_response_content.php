<?php

function Users_before_Q_response_content()
{
	$url = Q_Request::url();

	Users_Vote::saveActivity("app", "visited");
	Users_Vote::saveActivity("page", base64_encode($url));
}