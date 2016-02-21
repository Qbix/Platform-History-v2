<?php

/**
 * @module Streams
 */
class Streams_Exception_NoSuchStream extends Q_Exception
{
	/**
	 * This exception is raised if Stream was not found in the system
	 * @class Streams_Exception_NoSuchStream
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Streams_Exception_NoSuchStream', 'no such stream was found in the system');
