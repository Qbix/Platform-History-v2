<?php

/**
 * @module Streams
 */
class Streams_Exception_Type extends Q_Exception
{
	/**
	 * This exception can be thrown when a different stream type was expected
	 * @class Streams_Exception_Type
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $expectedType the type that was expected
	 * @param {string} $type the type that was provided
	 *	Operation type
	 */	
};

Q_Exception::add('Streams_Exception_Type', 'Expected stream type {{expectedType}} instead of {{type}}');
