<?php

/**
 * @module Users
 */
class Users_Exception_NoSuchUser extends Q_Exception
{
	/**
	 * This exception is raised if user was not found in the system
	 * @class Users_Exception_NoSuchUser
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_NoSuchUser', 'No such user was found in the system');
