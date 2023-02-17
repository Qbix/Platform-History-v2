<?php

/**
 * Registers a user in the system
 *
 * @param {array} $_REQUEST 
 * @param {string} $_REQUEST.username The name of the user
 * @param {string|array} $_REQUEST.identifier Can be an email address or mobile number. Or it could be an array of $type => $info
 * @param {string} [$_REQUEST.identifier.identifier] an email address or phone number
 * @param {array} [$_REQUEST.identifier.device] an array with keys "deviceId", "platform", "version"
 *   to store in the Users_Device table for sending notifications
 * @param {array|string} [$_REQUEST.icon=array()] Array of filename => url pairs
 * @param {string} [$_REQUEST.platform=null] Platform such as "facebook"
 * @throws {Q_Exception_WrongType} If identifier is not e-mail or modile
 * @throws {Q_Exception} If user was already verified for someone else
 * @throws {Users_Exception_AlreadyVerified} If user was already verified
 * @throws {Users_Exception_UsernameExists} If username exists
 */
function Users_register_post()
{
	$platform = null;
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
		true,
		@compact('activation')
	);
	if (Q_Config::get('Users', 'register', 'loginEvenBeforeActivate', false)
	or !$user->shouldInterposeActivateDialog()) {
		Users::setLoggedInUser($user);
	}
	
	// this also logs the user in
	Users::$cache['user'] = $user;

	Q_Response::setSlot('activateLink', Users::$cache['Users/activate link']);
}
