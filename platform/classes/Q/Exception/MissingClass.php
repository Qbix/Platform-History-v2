<?php

/**
 * @module Q
 */
class Q_Exception_MissingClass extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingClass
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $class_name
	 */
};

Q_Exception::add('Q_Exception_MissingClass', 'missing class {{className}}', 424);
