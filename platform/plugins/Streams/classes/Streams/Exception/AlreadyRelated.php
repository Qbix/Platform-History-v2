<?php

/**
 * @module Streams
 */
class Streams_Exception_AlreadyRelated extends Q_Exception
{
	/**
	 * An exception is raised when streams are already related
	 * @class Streams_Exception_AlreadyRelated
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $state
	 *	Describes relation state
	 */	
};

Q_Exception::add('Streams_Exception_AlreadyRelated', 'The stream is already {{state}}');
