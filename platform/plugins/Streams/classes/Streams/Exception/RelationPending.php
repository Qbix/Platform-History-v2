<?php

/**
 * @module Streams
 */
class Streams_Exception_RelationPending extends Q_Exception
{
	/**
	 * An exception is raised when streams relation is pending
	 * @class Streams_Exception_RelationPending
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $state
	 *	Describes relation state
	 */	
};

Q_Exception::add('Streams_Exception_RelationPending', 'The stream has been alredy {{state}}. Please, wait for admin to approve.');
