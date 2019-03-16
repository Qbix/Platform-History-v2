<?php

/**
 * @module Q
 */
class Q_Exception_FailedValidation extends Q_Exception
{
	/**
	 * @class Q_Exception_FailedValidation
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_FailedValidation', '{{message}}');
