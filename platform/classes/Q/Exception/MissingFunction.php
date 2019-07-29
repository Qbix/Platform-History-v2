<?php

/**
 * @module Q
 */
class Q_Exception_MissingFunction extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingFunction
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $function_name
	 */
};

Q_Exception::add('Q_Exception_MissingFunction', 'missing function {{function_name}}', 424);
