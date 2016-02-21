<?php

/**
 * @module Streams
 */
class Streams_Exception_Relation extends Q_Exception
{
	/**
	 * An exception is raised when relation failed
	 * @class Streams_Exception_Relation
	 * @constructor
	 * @extends Q_Exception
	 */	
}
Q_Exception::add('Streams_Exception_Relation', 'Relation failed');
