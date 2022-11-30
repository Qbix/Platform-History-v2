<?php

/**
 * @module Users
 */
class Users_Exception_AuthenticationExpired extends Q_Exception
{
	/**
	 * An exception is raised if some external authentication token has expired
	 * @class Users_Exception_AuthenticationExpired
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_AuthenticationExpired', 'Authentication token has expired', 401);
