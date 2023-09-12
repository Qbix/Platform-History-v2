<?php

/**
 * @module Users
 */
class Users_Exception_LoggedIn extends Q_Exception
{
	/**
	 * Thrown when the user is required to be logged in, but they aren't
	 * @class Users_Exception_LoggedIn
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_LoggedIn', 'You are logged in');
