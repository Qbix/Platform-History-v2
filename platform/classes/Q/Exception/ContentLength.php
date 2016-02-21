<?php

/**
 * @module Q
 */
class Q_Exception_ContentLength extends Q_Exception
{
	/**
	 * @class Q_Exception_ContentLength
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_ContentLength', 'ContentLength exceeds {{exceeds}}');
