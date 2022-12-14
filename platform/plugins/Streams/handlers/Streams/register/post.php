<?php

/**
 * Registers a user. Can be hooked to 'Users/register' before event
 * so it can override standard functionality.
 * Method ensures user registration based on full name and also handles registration of
 * invited user
 * @method register
 * @static
 * @param {string} $_REQUEST.fullName The full name of the user in the format 'First Last' or 'Last, First'
 * @param {string|array} $_REQUEST.identifier Can be an email address or mobile number. Or it could be an array of $type => $info
 * @param {string} [$_REQUEST.identifier.identifier] an email address or phone number
 * @param {array} [$_REQUEST.identifier.device] an array with keys "deviceId", "platform", "version"
 *   to store in the Users_Device table for sending notifications
 * @param {array} [$_REQUEST.icon=array()] User icon
 * @throws {Q_Exception_WrongType} If identifier is not e-mail or modile
 * @throws {Q_Exception} If user was already verified for someone else
 * @throws {Users_Exception_AlreadyVerified} If user was already verified
 * @throws {Users_Exception_UsernameExists} If username exists
 */
function Streams_register_post()
{
	$fullName = null;
	$activation = null;
	extract($_REQUEST, EXTR_IF_EXISTS);
	
	if (Q_Config::get('Users', 'login', 'noRegister', false)) {
		throw new Users_Exception_NoRegister(array(), array(
			'identifier', 'emailAddress', 'mobileNumber'
		));
	}
	if (empty($fullName)) {
		throw new Q_Exception("Please enter your name", 'name');
	}
	$user = Streams::register(
		Streams::splitFullName($fullName), 
		Users::requestedIdentifier(), 
		true,
		@compact('activation')
	);

	if (Q_Config::get('Users', 'register', 'loginEvenBeforeActivate', false)) {
		Users::setLoggedInUser($user);
	}
	
	// this also logs the user in
	Users::$cache['user'] = $user;

	Q_Response::setSlot('activateLink', Users::$cache['Users/activate link']);
}
