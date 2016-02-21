<?php

/**
 * @module Users
 */
class Users_Exception_OAuthTokenInvalid extends Q_Exception
{
	/**
	 * An exception is raised if oAuth token is invalid
	 * @class Users_Exception_OAuthTokenInvalid
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_OAuthTokenInvalid', 'OAuth token invalid');
