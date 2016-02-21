<?php

/**
 * @module Q
 */
class Q_Exception_InvalidInput extends Q_Exception
{
	/**
	 * @class Q_Exception_InvalidInput
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $source
	 */
};

Q_Exception::add('Q_Exception_InvalidInput', 'invalid input encountered in {{source}}');
