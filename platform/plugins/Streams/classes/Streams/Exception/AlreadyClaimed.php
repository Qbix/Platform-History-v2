<?php

/**
 * @module Streams
 */
class Streams_Exception_AlreadyClaimed extends Q_Exception
{
	/**
	 * An exception is raised when the invite was already accepted
	 * @class Streams_Exception_AlreadyClaimed
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Streams_Exception_AlreadyClaimed', 'this invite was already claimed');
