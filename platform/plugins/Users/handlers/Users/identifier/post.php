<?php

function Users_identifier_post()
{
	$userId = Q::ifset($_REQUEST, 'userId', null);
	if (isset($userId)) {
		$user = Users_User::fetch($userId, true);
		if ($user->emailAddress or $user->mobileNumber) {
			throw new Q_Exception("This user is already able to log in and set their own email and mobile number.");
		}
	} else {
		$user = Users::loggedInUser(true);
	}
	$app = Q::app();
	$fields = array();

	$identifier = Users::requestedIdentifier($type);
	if (!$type) {
		throw new Q_Exception(
			"a valid email address or mobile number or wallet is required",
			array('identifier', 'mobileNumber', 'emailAddress')
		);
	}
	if ($type === 'email') {
		$subject = Q_Config::get(
			'Users', 'transactional', 'identifier', 'subject', "Welcome! Verify your email address." 
		);
		$view = Q_Config::get(
			'Users', 'transactional', 'identifier', 'body', 'Users/email/addEmail.php'
		);
		$user->addEmail(
			$identifier, $subject, $view, array(), array('html' => true)
		);
	} else if ($type === 'mobile') {
		$view = Q_Config::get(
			'Users', 'transactional', 'identifier', 'sms', 'Users/sms/addMobile.php'
		);
		$user->addMobile(
			$identifier,
			$view
		);
	}
}
