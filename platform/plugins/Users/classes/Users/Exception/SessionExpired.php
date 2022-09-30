<?php

/**
 * @module Users
 */
class Users_Exception_SessionExpired extends Q_Exception
{
	/**
	 * An exception is raised if user session has expired
	 * @class Users_Exception_SessionExpired
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_SessionExpired', 'Session has expired');
