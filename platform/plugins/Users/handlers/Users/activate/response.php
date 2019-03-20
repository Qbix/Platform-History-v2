<?php

function Users_activate_response()
{
	$content = Q::event('Users/activate/response/content');
	Q_Response::setSlot('content', $content);
	Q_Response::setSlot('column0', $content); // for SmartApp
}