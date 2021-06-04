<?php

function Users_after_Q_response_content()
{
	$url = Q_Request::url();

	Users_Vote::setStat("app", "visited");
	Users_Vote::setStat("page", base64_encode($url));
}