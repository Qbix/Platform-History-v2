<?php

/**
 * @module Q
 */
class Q_Exception_MethodNotSupported extends Q_Exception
{
	/**
	 * @class Q_Exception_MethodNotSupported
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $method
	 */
};

Q_Exception::add('Q_Exception_MethodNotSupported', 'the {{method}} method is not supported', 405);
