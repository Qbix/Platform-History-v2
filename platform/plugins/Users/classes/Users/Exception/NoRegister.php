<?php

/**
 * @module Users
 */
class Users_Exception_NoRegister extends Q_Exception
{
	/**
	 * An exception is raised if registering a user is not allowed
	 * @class Users_Exception_NoRegister
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_NoRegister', 'Cannot directly register a user.');
