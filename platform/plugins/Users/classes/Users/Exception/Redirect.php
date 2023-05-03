<?php

/**
 * @module Users
 */
class Users_Exception_Redirect extends Q_Exception
{
	/**
	 * An exception is raised if the redirect is not allowed
	 * @class Users_Exception_Redirect
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} url
	 */
};

Q_Exception::add('Users_Exception_Redirect', 'Redirecting is not allowed to {{uri}}');
