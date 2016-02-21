<?php

/**
 * @module Q
 */
class Q_Exception_FilePermissions extends Q_Exception
{
	/**
	 * @class Q_Exception_FilePermissions
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $by
	 * @param {string} $plugin
	 * @param {string} $version
	 */
};

Q_Exception::add('Q_Exception_FilePermissions', 'Not enough permissions to {{action}} {{filename}}.{{recommendation}}');
