<?php

function Users_user_validate()
{
	Q_Valid::nonce(true);
	$type = isset($_REQUEST['identifierType'])
		? $_REQUEST['identifierType']
		: Q_Config::get("Users", "login", "identifierType", "email,mobile");
	$parts = explode(',', $type);
	$accept_mobile = true;
	$expected = 'email address or mobile number';
	$fields = array('emailAddress', 'mobileNumber', 'identifier');
	if (count($parts) === 1) {
		if ($parts[0] === 'email') {
			$expected = 'email address';
			$fields = array('emailAddress', 'identifier');
			$accept_mobile = false;
		} else if ($parts[0] === 'mobile') {
			$expected = 'mobile number';
			$fields = array('mobileNumber', 'identifier');
		}
	}
	if (!isset($_REQUEST['identifier'])) {
		throw new Q_Exception("a valid $expected is required", $fields);
	}
	if (!Q_Valid::email($_REQUEST['identifier'])) {
		if (!$accept_mobile) {
			throw new Q_Exception("a valid $expected is required", $fields);
		}
		if (!Q_Valid::phone($_REQUEST['identifier'])) {
			throw new Q_Exception("a valid $expected is required", $fields);
		}
	}
}
