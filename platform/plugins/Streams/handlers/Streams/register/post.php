<?php

/**
 * Registers a user in the system
 */
function Streams_register_post()
{
	$provider = null;
	$fullName = null;
	$activation = null;
	extract($_REQUEST, EXTR_IF_EXISTS);
	
	if (Q_Config::get('Users', 'login', 'noRegister', false)) {
		throw new Users_Exception_NoRegister(array(), array(
			'identifier', 'emailAddress', 'mobileNumber'
		));
	}
	$user = Streams::register(
		$fullName, 
		Users::requestedIdentifier(), 
		true,
		$provider,
		compact('activation')
	);
	Users::setLoggedInUser($user);
	
	// this also logs the user in
	Users::$cache['user'] = $user;
}
