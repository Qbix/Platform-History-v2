<?php

/**
 * @module Q
 */
class Q_Exception_BadValue extends Q_Exception
{
	/**
	 * @class Q_Exception_BadValue
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $internal
	 * @param {string} $problem
	 */
};

Q_Exception::add('Q_Exception_BadValue', 'bad value found in {{internal}}: {{problem}}');
