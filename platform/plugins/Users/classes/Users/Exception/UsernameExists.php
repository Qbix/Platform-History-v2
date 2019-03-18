<?php

/**
 * @module Users
 */
class Users_Exception_UsernameExists extends Q_Exception
{
	/**
	 * An exception is raised if username already exists
	 * @class Users_Exception_UsernameExists
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_UsernameExists', 'Someone else has that username');
