<?php

function Users_resend_post()
{
	$identifier = Users::requestedIdentifier($type);
	if ($type !== 'email' and $type !== 'mobile') {
		throw new Q_Exception("Expecting a valid email or mobile number", array('identifier', 'emailAddress', 'mobileNumber'));
	}
	if ($type === 'email') {
		$thing = 'email address';
		$field = 'emailAddress';
		$row = new Users_Email();
		$row->address = $identifier;
	} else if ($type === 'mobile') {
		$thing = 'mobile number';
		$field = 'mobileNumber';
		$row = new Users_Mobile();
		$row->number = $identifier;
	} else {
		throw new Q_Exception("Expecting a valid email or mobile number", array('identifier', 'emailAddress', 'mobileNumber'));
	}
	
	if ($row->retrieve()) {
		$userId = $row->userId;
	} else if ($ui = Users::identify($type, $identifier, 'future')) {
		$userId = $ui->userId;
	} else {
		throw new Q_Exception("That $thing was not found in the system", array('identifier', $field));
	}
	$user = new Users_User();
	$user->id = $userId;
	if (!$user->retrieve()) {
		throw new Q_Exception("No user corresponds to that $thing", array('identifier', $field));
	}
	if ($logged_in_user = Users::loggedInUser() and $logged_in_user->id != $user->id) {
		throw new Q_Exception("That $thing belongs to someone else", array('identifier', $field));
	}
	if ($type === 'email') {
		$existing = $user->addEmail($identifier);
		Users::$cache['emailAddress'] = $identifier;
	} else {
		$existing = $user->addMobile($identifier);
		Users::$cache['mobileNumber'] = $identifier;
	}
	if ($existing) {
		$existing->resendActivationMessage();
	}
	Users::$cache['user'] = $user;
	Q_Response::setSlot('activateLink', Users::$cache['Users/activate link']);
}
