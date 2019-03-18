<?php

/**
 * @module Streams
 */
class Streams_Exception_NoSubscriptions extends Q_Exception
{
	/**
	 * An exception is raised when streams are already related
	 * @class Streams_Exception_NoSubscriptions
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $state
	 *	Describes relation state
	 */	
};

Q_Exception::add('Streams_Exception_NoSubscriptions', 'Stream of type {{type}} does not support subscription');
