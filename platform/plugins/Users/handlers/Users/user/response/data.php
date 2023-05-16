<?php

function Users_user_response_data($params)
{
	$identifier = Users::requestedIdentifier($type);
	$hash = md5(strtolower(trim($identifier)));

	$sizes = Q_Image::getSizes("Users/icon");
	$largest = 0;
	foreach ($sizes as $k => $v) {
		if (intval($k) > $largest) {
			$largest = intval($k);
		}
	}
	$gravatar = ($type === 'email') ? '' : 'gravatar=0';
	$icon = Q_Config::get('Users', 'register', 'icon', 'leaveDefault', false)
		? $url = "{{Users}}/img/icons/default/$largest.png"
		: Q_Request::baseUrl()
			."/action.php/Users/thumbnail?$gravatar&hash=$hash&size=80&type="
			.Q_Config::get('Users', 'login', 'iconType', 'wavatar');

	// check our db
	if ($user = Users::userFromContactInfo($type, $identifier)) {
		$verified = !!Users::identify($type, $identifier);
		// NOTE: Do not return anything that would identify the user on the system
		return array(
			'exists' => true,
			'salt' => $user->salt,
			'verified' => $verified,
			// 'username' => $user->username,
			// 'displayName' => $displayname,
			// 'icon' => $verified ? $icon : $user->icon,
			'passphrase_set' => !empty($user->passphraseHash),
			// 'xids' => $user->getAllXids()
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
	
	if (empty($exists) and
	Q_Config::get('Users', 'login', 'noRegister', false)) {
		$nicetype = ($type === 'email') ? 'email address' : 'mobile number';
		throw new Q_Exception("This $nicetype was not registered", array('identifier'));
	}

	$result = array(
		"exists" => false,
		"entry" => array(array(
			"thumbnailUrl" => $icon
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
