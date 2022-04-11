<?php

/**
 * @module Q
 */
class Q_Exception_MissingObject extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingObject
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $name
	 */
};

Q_Exception::add('Q_Exception_MissingObject', 'missing {{name}}', 424);
