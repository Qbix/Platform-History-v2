<?php

/**
 * @module Streams
 */
class Streams_Exception_Type extends Q_Exception
{
	/**
	 * An exception is raised when stream does not support operation
	 * @class Streams_Exception_Type
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $name
	 *	Stream name
	 * @param {string} $type
	 *	Operation type
	 */	
};

Q_Exception::add('Streams_Exception_Type', 'Cannot post \'{{type}}\' messages to stream {{name}}');
