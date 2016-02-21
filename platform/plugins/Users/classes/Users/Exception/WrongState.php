<?php

/**
 * @module Users
 */
class Users_Exception_WrongState extends Q_Exception
{
	/**
	 * An exception is raised if state is wrong
	 * @class Users_Exception_WrongState
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $key
	 * @param {string} $state
	 */
};

Q_Exception::add('Users_Exception_WrongState', '$key is $state');
