<?php

/**
 * @module Q
 */
class Q_Exception_JsonEncode extends Q_Exception
{
	/**
	 * @class Q_Exception_JsonEncode
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_JsonEncode', 'JSON encode: {{message}}');
