<?php

/**
 * @module Users
 */
class Users_Exception_LastIdentifier extends Q_Exception
{
	/**
	 * An exception is raised if trying to remove last identifier
	 * @class Users_Exception_LastIdentifier
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $key
	 */
};

Q_Exception::add('Users_Exception_LastIdentifier', "You can't remove the last identifier");
