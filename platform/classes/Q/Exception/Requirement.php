<?php

/**
 * @module Q
 */
class Q_Exception_Requirement extends Q_Exception
{
	/**
	 * @class Q_Exception_Requirement
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $by
	 * @param {string} $plugin
	 * @param {string} $version
	 */
};

Q_Exception::add('Q_Exception_Requirement', 'Plugin \'{{by}}\' requires plugin \'{{plugin}}\' version {{version}} or compatible.');
