<?php

/**
 * @module Users
 */
class Users_Exception_NotAuthorized extends Q_Exception
{
	/**
	 * An exception is raised if user is not authorized
	 * @class Users_Exception_NotAuthorized
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_NotAuthorized', 'You are not authorized to do this');
