<?php

/**
 * @module Streams
 */
class Streams_Exception_Full extends Q_Exception
{
	/**
	 * An exception is raised when stream cannot support more participants
	 * @class Streams_Exception_Full
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $type
	 *	The type to display in the error message
	 */	
};

Q_Exception::add('Streams_Exception_Full', 'This {{type}} is full.');
