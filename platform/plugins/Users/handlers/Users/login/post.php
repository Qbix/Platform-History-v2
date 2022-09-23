<?php

function Users_login_post()
{
	$identifier = Users::requestedIdentifier();
	if (!empty($_REQUEST['passphrase'])) {
		$passphrase = $_REQUEST['passphrase'];
		$isHashed = !empty($_REQUEST['isHashed']) ? $_REQUEST['isHashed'] : false;
	} else if (!empty($_REQUEST['passphrase_hashed'])) {
		$passphrase = $_REQUEST['passphrase_hashed'];
		$isHashed = true;
	} else {
		throw new Q_Exception("Please enter your pass phrase", 'passphrase');
	}
	$user = Users::login($identifier, $passphrase, $isHashed);
	Users::$cache['user'] = $user;
}