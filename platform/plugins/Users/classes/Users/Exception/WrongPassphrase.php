<?php

/**
 * @module Users
 */
class Users_Exception_WrongPassphrase extends Q_Exception
{
	/**
	 * An exception is raised if passphrase is wrong
	 * @class Users_Exception_WrongPassphrase
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_WrongPassphrase', 'That is not the right pass phrase');
