<?php

/**
 * @module Q
 */
class Q_Exception_NonceExpired extends Q_Exception
{
	/**
	 * @class Q_Exception_NonceExpired
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_NonceExpired', '{{message}}', 409);
