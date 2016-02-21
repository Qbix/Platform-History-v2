<?php

function Users_before_Q_response_notices()
{
	$from_parts = explode(' ', Q_Request::special('fromSuccess', false));
	$from = reset($from_parts);
	if ($from === 'Users/activate') {
		$user = Q_Session::id() ? Users::loggedInUser() : null;
		$notice = $user
			? "You've completed the activation."
			: "You've completed the activation. Try logging in now.";
		Q_Response::setNotice('Users/activate', $notice, true);
	} else if ($from === 'Users/resend') {
		$notice = 'Your activation message has been re-sent. You should get it in a moment.';
		Q_Response::setNotice('Users/resend', $notice, true);
	}
}