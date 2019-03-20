<?php

/**
 * @module Q
 */
class Q_Exception_WrongValue extends Q_Exception
{
	/**
	 * @class Q_Exception_WrongValue
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $field
	 * @param {string} $range
	 */
};

Q_Exception::add('Q_Exception_WrongValue', 'wrong value for {{field}} -- expected {{range}}');
