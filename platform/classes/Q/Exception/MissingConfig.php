<?php

/**
 * @module Q
 */
class Q_Exception_MissingConfig extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingConfig
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $fieldpath
	 */
};

Q_Exception::add('Q_Exception_MissingConfig', 'missing configuration field {{fieldpath}}', 424);
