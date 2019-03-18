<?php

/**
 * @module Users
 */
class Users_Exception_EmailMessage extends Q_Exception
{
	/**
	 * An exception is raised if email message can't be sent
	 * @class Users_Exception_EmailMessage
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $key
	 */
};

Q_Exception::add('Users_Exception_EmailMessage', 'Sending email failed: {{error}}');
