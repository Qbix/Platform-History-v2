<?php

/**
 * @module Streams
 */
class Streams_Exception_Payment extends Q_Exception
{
	/**
	 * An exception is raised when paid stream is not payed
	 * @class Streams_Exception_Payment
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $type
	 *	The type to display in the error message
	 */	
};

Q_Exception::add('Streams_Exception_Payment', 'Payment required.');
