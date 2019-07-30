<?php

/**
 * @module Q
 */
class Q_Exception_WrongType extends Q_Exception
{
	/**
	 * @class Q_Exception_WrongType
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $field
	 * @param {string} $type
	 */
};

Q_Exception::add('Q_Exception_WrongType', '{{field}} is the wrong type, expecting {{type}}', 400);
