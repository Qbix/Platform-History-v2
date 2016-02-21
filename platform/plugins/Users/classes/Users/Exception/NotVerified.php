<?php

/**
 * @module Users
 */
class Users_Exception_NotVerified extends Q_Exception
{
	/**
	 * An exception is raised if user is not verified
	 * @class Users_Exception_NotVerified
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $type
	 */
};

Q_Exception::add('Users_Exception_NotVerified', 'This $type has not been verified yet');
