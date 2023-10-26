<?php

/**
 * @module Q
 */
class Q_Exception_AttemptsExceeded extends Q_Exception
{
	/**
	 * @class Q_Exception_AttemptsExceeded
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $source
	 */
};

Q_Exception::add('Q_Exception_AttemptsExceeded', 'number of attempts exceeded');
