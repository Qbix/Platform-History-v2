<?php

function Users_before_Q_response_notices()
{
	$from_parts = explode(' ', Q_Request::special('fromSuccess', false));
	$from = reset($from_parts);
	$text = Q_Text::get('Users/content');
	if ($from === 'Users/activate') {
		$user = Q_Session::id() ? Users::loggedInUser() : null;
		$key = 'CompletedActivation' . ($user ? '' : 'LogIn');
		$notice = $text['notifications'][$key];
		Q_Response::setNotice('Users/activate', $notice, array(
			'timeout' => Q_Config::get('Users', 'notices', 'timeout', 5)
		));
	} else if ($from === 'Users/resend') {
		$notice = 'Your activation message has been re-sent. You should get it in a moment.';
		Q_Response::setNotice('Users/resend', $notice, array(
			'timeout' => Q_Config::get('Users', 'notices', 'timeout', 5)
		));
	}
}