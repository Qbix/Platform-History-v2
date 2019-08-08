<?php

/**
 * @module Q
 */
class Q_Exception_MissingPlugin extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingPlugin
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $plugin
	 */
};

Q_Exception::add('Q_Exception_MissingPlugin', 'missing plugin {{plugin}}', 424);
