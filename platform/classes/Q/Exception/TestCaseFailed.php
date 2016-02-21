<?php

/**
 * @module Q
 */
class Q_Exception_TestCaseFailed extends Q_Exception_TestCase
{
	/**
	 * @class Q_Exception_TestCaseFailed
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_TestCaseFailed', 'failed. {{message}}');
