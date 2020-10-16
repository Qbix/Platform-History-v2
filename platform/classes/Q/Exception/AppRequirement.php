<?php

/**
 * @module Q
 */
class Q_Exception_AppRequirement extends Q_Exception
{
	/**
	 * @class Q_Exception_AppRequirement
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $by
	 * @param {string} $plugin
	 * @param {string} $version
	 */
};

Q_Exception::add('Q_Exception_AppRequirement', 'App \'{{by}}\' requires plugin \'{{plugin}}\' version {{version}} or compatible.');
