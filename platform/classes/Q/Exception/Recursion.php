<?php

/**
 * @module Q
 */
class Q_Exception_Recursion extends Q_Exception
{
	/**
	 * @class Q_Exception_Recursion
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $function_name
	 */
};

Q_Exception::add('Q_Exception_Recursion', 'seems we have runaway recursive calls to {{function_name}}');
