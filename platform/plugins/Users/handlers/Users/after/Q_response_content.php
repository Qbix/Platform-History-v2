<?php

function Users_after_Q_response_content()
{
	$url = Q_Request::url();

	Users_Vote::saveActivity("app", "visited");
	Users_Vote::saveActivity("page", base64_encode($url));
}