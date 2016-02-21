<?php

/**
 * Registers a user in the system
 */
function Users_register_post()
{
	$provider = null;
	$icon = null;
	$username = null;
	$activation = null;
	extract($_REQUEST, EXTR_IF_EXISTS);
	
	if (Q_Config::get('Users', 'login', 'noRegister', false)) {
		throw new Q_Exception("Cannot directly register a user.", array('identifier', 'emailAddress', 'mobileNumber'));
	}
	
	if (empty($username)) {
		throw new Q_Exception("Please enter a username", 'username');
	}
	
	$user = Users::register(
		$username, 
		Users::requestedIdentifier(), 
		$icon,
		$provider,
		compact('activation')
	);
	Users::setLoggedInUser($user);
	
	// this also logs the user in
	Users::$cache['user'] = $user;
}
