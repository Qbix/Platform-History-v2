<?php

function Users_activate_response()
{
	$content = Q::event('Users/activate/response/content');
	$text = Q_Text::get('Users/content');
	Q_Response::setSlot('title', $text['activate']['ActivateMyAccount']);
	Q_Response::setSlot('dialog', $content);
	Q_Response::setSlot('content', $content);
	Q_Response::setSlot('column0', $content); // for SmartApp
}