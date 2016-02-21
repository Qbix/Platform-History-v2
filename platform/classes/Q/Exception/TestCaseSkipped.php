<?php

/**
 * @module Q
 */
class Q_Exception_TestCaseSkipped extends Q_Exception_TestCase
{
	/**
	 * @class Q_Exception_TestCaseSkipped
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_TestCaseSkipped', 'skipped. {{message}}');
