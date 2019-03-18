<?php

function Users_after_Users_addIdentifier($params)
{
	extract($params);
	if (!Q_Config::get('Users', 'notices', 'identifier', true)) {
		return;
	}
	$loggedInUser = Users::loggedInUser();
	if (!$loggedInUser or $loggedInUser->id !== $user->id) {
		return;
	}
	if (isset($email)) {
		$resend_button = "<button id='notices_set_email' class='Q_button'>Need it re-sent?</button>";
		Q_Response::setNotice('Users/email', "Please check your email for an activation link. $resend_button");
	} else if (isset($mobile)) {
		$resend_button = "<button id='notices_set_mobile' class='Q_button'>Need it re-sent?</button>";
		Q_Response::setNotice('Users/mobile', "Please check your mobile phone for an activation message. $resend_button");
	}
}
