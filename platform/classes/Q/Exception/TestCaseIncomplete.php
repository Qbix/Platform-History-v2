<?php

/**
 * @module Q
 */
class Q_Exception_TestCaseIncomplete extends Q_Exception_TestCase 
{
	/**
	 * @class Q_Exception_TestCaseIncomplete
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_TestCaseIncomplete', 'incomplete. {{message}}');
