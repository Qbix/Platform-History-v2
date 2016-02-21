<?php

/**
 * @module Q
 */
abstract class Q_Exception_TestCase extends Q_Exception 
{
	/**
	 * @class Q_Exception_TestCase
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_TestCase', 'test case exception: {{message}}');
