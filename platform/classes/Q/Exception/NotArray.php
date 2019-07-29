<?php

/**
 * @module Q
 */
class Q_Exception_NotArray extends Q_Exception
{
	/**
	 * @class Q_Exception_NotArray
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $keys
	 */
};

Q_Exception::add('Q_Exception_NotArray', 'value under {{keys}} is not an array', 400);
