<?php

/**
 * @module Q
 */
class Q_Exception_NotFound extends Q_Exception 
{
	/**
	 * @class Q_Exception_NotFound
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_NotFound', 'Not found: {{url}}', 404);
