<?php

/**
 * @module Streams
 */
class Streams_Exception_Related extends Q_Exception
{
	/**
	 * An exception is raised when relation is inconcistent
	 * @class Streams_Exception_Related
	 * @constructor
	 * @extends Q_Exception
	 */	
};

Q_Exception::add('Streams_Exception_Related', 'Relation inconsistent. Failed posting related message');
