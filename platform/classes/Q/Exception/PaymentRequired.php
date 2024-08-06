<?php

/**
 * @module Q
 */
class Q_Exception_PaymentRequired extends Q_Exception
{
	/**
	 * @class Q_Exception_PaymentRequired
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_PaymentRequired', 'Payment required: {{message}}', 402);
