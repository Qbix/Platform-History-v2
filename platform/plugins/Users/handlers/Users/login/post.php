<?php

function Users_login_post()
{
	$identifier = Users::requestedIdentifier();
	if (!empty($_REQUEST['passphrase_hashed'])) {
		$isHashed = true;
		$passphrase = $_REQUEST['passphrase_hashed'];
	} else {
		$isHashed = !empty($_REQUEST['isHashed']) ? $_REQUEST['isHashed'] : false;
		$passphrase = $_REQUEST['passphrase'];
		if (empty($passphrase)) {
			throw new Q_Exception("Please enter your pass phrase", 'passphrase');
		}
	}
	$user = Users::login($identifier, $passphrase, $isHashed);
	Users::$cache['user'] = $user;
}