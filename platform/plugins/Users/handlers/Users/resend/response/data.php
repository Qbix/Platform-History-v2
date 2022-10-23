<?php

function Users_resend_response_data()
{
	$activationLink = null;
	if ($user = Q::ifset(Users::$cache, 'user', null)) {
		if ($mobile = Q::ifset(Users::$cache, 'mobile', null)) {
			$fields = array('m' => $mobile);
		} else if ($user->signedUpWith === 'mobile') {
			$mobile = Q::ifset($user, 'mobileNumber', $user->mobileNumberPending);
			$fields = array('m' => $mobile);
		} else if ($email = Q::ifset(Users::$cache, 'email', null)) {
			$fields = array('e' => $email);
		} else if ($user->signedUpWith === 'email') {
			$mobile = Q::ifset($user, 'emailAddress', $user->emailAddressPending);
		} else {
			$fields = array();
		}
		$user = $user->exportArray();
		if ($fields) {
			$activationLink = Q_Uri::url("Users/activate?")
			. '?' . http_build_query($fields);
		}
	}
	return compact('user', 'activationLink');
}