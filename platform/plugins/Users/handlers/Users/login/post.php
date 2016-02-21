<?php

function Users_login_post()
{
	$passphrase = $_REQUEST['passphrase'];
	if (empty($passphrase)) {
		throw new Q_Exception("Please enter your pass phrase", 'passphrase');
	}
	$identifier = Users::requestedIdentifier();
	$isHashed = !empty($_REQUEST['isHashed']) ? $_REQUEST['isHashed'] : false;
	$user = Users::login($identifier, $passphrase, $isHashed);
	Users::$cache['user'] = $user;
}