<?php

/**
 * @module Q
 */
class Q_Exception_JsonDecode extends Q_Exception
{
	/**
	 * @class Q_Exception_JsonDecode
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_JsonDecode', 'JSON decode: {{message}}');
