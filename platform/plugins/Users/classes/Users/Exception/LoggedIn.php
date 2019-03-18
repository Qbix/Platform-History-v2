<?php

/**
 * @module Users
 */
class Users_Exception_LoggedIn extends Q_Exception
{
	/**
	 * An exception is raised if user is logged in
	 * @class Users_Exception_LoggedIn
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_LoggedIn', 'You are logged in');
