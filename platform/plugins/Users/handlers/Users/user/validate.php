<?php
	
function Users_user_validate()
{
	if (isset($_REQUEST['userIds']) or isset($_REQUEST['batch'])) {
		return;
	}
	$type = isset($_REQUEST['identifierType'])
		? $_REQUEST['identifierType']
		: Q_Config::get("Users", "login", "identifierType", "email,mobile");
	$parts = explode(',', $type);
	$accept_mobile = $accept_email = true;
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
			$accept_email = false;
		}
	}
	if (!isset($_REQUEST['identifier'])) {
		throw new Q_Exception("a valid $expected is required", $fields);
	}
	if (Q_Valid::email($_REQUEST['identifier'])) {
		if (!$accept_email) {
			throw new Q_Exception("a valid $expected is required", $fields);
		}
	} else {
		if (!$accept_mobile) {
			throw new Q_Exception("a valid $expected is required", $fields);
		}
		if (!Q_Valid::phone($_REQUEST['identifier'])) {
			throw new Q_Exception("a valid $expected is required", $fields);
		}
	}
	
	$identifier = Users::requestedIdentifier($type);

	// check our db
	if ($user = Users::userFromContactInfo($type, $identifier)) {
		$verified = !!Users::identify($type, $identifier);
		return array(
			'exists' => $user->id,
			'verified' => $verified,
			'username' => $user->username,
			'icon' => $user->icon,
			'passphrase_set' => !empty($user->passphraseHash),
			'xids' => $user->getAllXids()
		);
	}
	if ($type === 'email') {
		$email = new Users_Email();
		Q_Valid::email($identifier, $normalized);
		$email->address = $normalized;
		$exists = $email->retrieve();
	} else if ($type === 'mobile') {
		$mobile = new Users_Mobile();
		Q_Valid::phone($identifier, $normalized);
		$mobile->number = $normalized;
		$exists = $mobile->retrieve();
	}

	if (empty($exists) and Q_Config::get('Users', 'login', 'noRegister', false)) {
		$nicetype = ($type === 'email') ? 'email address' : 'mobile number';
		throw new Q_Exception("This $nicetype was not registered", array('identifier'));
	}
}