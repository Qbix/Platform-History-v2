<?php

function Users_user_response_data($params)
{
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
			'fb_uid' => $user->fb_uid ? $user->fb_uid : null
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

	
	// Get Gravatar info
	// WARNING: INTERNET_REQUEST
	$hash = md5(strtolower(trim($identifier)));
	$thumbnailUrl = Q_Request::baseUrl()
		."/action.php/Users/thumbnail?hash=$hash&size=80&type="
		.Q_Config::get('Users', 'login', 'iconType', 'wavatar');
	$json = @file_get_contents("http://www.gravatar.com/$hash.json");
	$result = json_decode($json, true);
	if ($result) {
		if ($type === 'email') {
			$result['emailExists'] = !empty($exists);
		} else if ($type === 'mobile') {
			$result['mobileExists'] = !empty($exists);
		}
		return $result;
	}
	
	// otherwise, return default
	$email_parts = explode('@', $identifier, 2);
	$result = array(
		"entry" => array(array(
			"id" => "571",
			"hash" => "357a20e8c56e69d6f9734d23ef9517e8",
			"requestHash" => "357a20e8c56e69d6f9734d23ef9517e8",
			"profileUrl" => "http://gravatar.com/test",
			"preferredUsername" => ucfirst($email_parts[0]),
			"thumbnailUrl" => $thumbnailUrl,
			"photos" => array(),
			"displayName" => "",
			"urls" => array(),
		))
	);

	if ($type === 'email') {
		$result['emailExists'] = !empty($exists);
	} else {
		$result['mobileExists'] = !empty($exists);
	}
	if ($terms_label = Users::termsLabel('register')) {
		$result['termsLabel'] = $terms_label;
	}
	return $result;
}
