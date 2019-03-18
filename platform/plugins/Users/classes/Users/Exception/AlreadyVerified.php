<?php

/**
 * @module Users
 */
class Users_Exception_AlreadyVerified extends Q_Exception
{
	/**
	 * An exception is raised if user is already verified
	 * @class Users_Exception_AlreadyVerified
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $key
	 */
};

Q_Exception::add('Users_Exception_AlreadyVerified', 'Another user has verified this {{key}}');
