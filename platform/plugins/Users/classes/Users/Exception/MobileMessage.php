<?php

/**
 * @module Users
 */
class Users_Exception_MobileMessage extends Q_Exception
{
	/**
	 * An exception is raised if mobile message can't be sent
	 * @class Users_Exception_MobileMessage
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $key
	 */
};

Q_Exception::add('Users_Exception_MobileMessage', 'Sending text message failed: $error');
