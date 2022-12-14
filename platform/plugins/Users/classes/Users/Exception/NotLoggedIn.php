<?php

/**
 * @module Users
 */
class Users_Exception_NotLoggedIn extends Q_Exception
{
	/**
	 * An exception is raised if user is not logged in
	 * @class Users_Exception_NotLoggedIn
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_NotLoggedIn', 'You are not logged in. <a href="#login" data-users-login>Click here to log in </a>', 401);
