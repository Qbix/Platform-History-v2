<?php

function Users_activate_objects()
{
	$uri = Q_Dispatcher::uri();
	$email = null;
	$mobile = null;
	$user = null;
	$emailAddress = Q::ifset(Users::$cache, 'emailAddress', null);
	$mobileNumber = Q::ifset(Users::$cache, 'mobileNumber', null);
	
	if ($emailAddress) {
		$user = Users_activate_objects_email(Users::$cache['emailAddress'], $email);
		$type = 'email address';
	}

	if ($mobileNumber) {
		$user = Users_activate_objects_mobile($mobileNumber, $mobile);
		$type = 'mobile number';
	}

	Users::$cache = @compact('user', 'email', 'mobile', 'type', 'emailAddress', 'mobileNumber');
}

function Users_activate_objects_email($emailAddress, &$email)
{	
	Q_Response::removeNotice('Users/activate/objects');
	$email = new Users_Email();
	if (!Q_Valid::email($emailAddress, $normalized)) {
		return;
	}
	$email->address = $normalized;
	if (!$email->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'email',
			'criteria' => "address $normalized"
		));
	}
	$user = Users::loggedInUser();
	if ($user) {
		if ($user->id != $email->userId) {
			throw new Q_Exception("You are logged in as a different user.");
		}
	} else {
		$user = new Users_User();
		$user->id = $email->userId;
		if (!$user->retrieve()) {
			throw new Q_Exception("Missing user corresponding to this email address.", "emailAddress");
		}
	}
	if ($email->activationCode != $_REQUEST['code']) {
		throw new Q_Exception("The activation code does not match. Did you get a newer email?", 'code');
	}
	$timestamp = Users_Email::db()->getCurrentTimestamp();
	if ($timestamp > Users_Email::db()->fromDateTime($email->activationCodeExpires)) {
		throw new Q_Exception("Activation code expired");
	}
	if (Q_Request::method() !== 'POST'
	and empty($_REQUEST['p'])
	and isset($user->emailAddress)
	and $user->emailAddress == $email->address) {
		$displayName = Streams::displayName($user);
		Q_Response::setNotice('Users/activate/objects', "$normalized has already been activated for $displayName", true);
		return $user;
	}
	return $user;
}

function Users_activate_objects_mobile($mobileNumber, &$mobile)
{
	Q_Response::removeNotice('Users/activate/objects');
	$mobile = new Users_Mobile();
	if (!Q_Valid::phone($mobileNumber, $normalized)) {
		return;
	}
	$mobile->number = $normalized;
	if (!$mobile->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'mobile phone',
			'criteria' => "number $normalized"
		));
	}
	$user = Users::loggedInUser();
	if ($user) {
		if ($user->id != $mobile->userId) {
			throw new Q_Exception("You are logged in as a different user.");
		}
	} else {
		$user = new Users_User();
		$user->id = $mobile->userId;
		if (!$user->retrieve()) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'user',
				'criteria' => 'id = '.$user->id
			));
		}
	}
	if ($mobile->activationCode != $_REQUEST['code']) {
		throw new Q_Exception("The activation code does not match. Did you get a newer message?", 'code');
	}
	$timestamp = Users_Mobile::db()->getCurrentTimestamp();
	if ($timestamp > Users_Mobile::db()->fromDateTime($mobile->activationCodeExpires)) {
		throw new Q_Exception("Activation code expired");
	}
	if (Q_Request::method() !== 'POST'
	and empty($_REQUEST['p'])
	and isset($user->mobileNumber)
	and $user->mobileNumber == $mobile->number) {
		$displayName = Streams::displayName($user);
		Q_Response::setNotice('Users/activate/objects', "$normalized has already been activated for $displayName", true);
		return $user;
	}
	return $user;
}
