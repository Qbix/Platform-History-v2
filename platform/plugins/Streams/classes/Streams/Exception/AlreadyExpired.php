<?php

/**
 * @module Streams
 */
class Streams_Exception_AlreadyExpired extends Q_Exception
{
	/**
	 * An exception is raised when the invite was already expired
	 * @class Streams_Exception_AlreadyExpired
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Streams_Exception_AlreadyExpired', 'this invite has already expired');
