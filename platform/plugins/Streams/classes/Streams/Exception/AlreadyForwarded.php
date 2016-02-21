<?php

/**
 * @module Streams
 */
class Streams_Exception_AlreadyForwarded extends Q_Exception
{
	/**
	 * An exception is raised when the invite was already forwarded
	 * @class Streams_Exception_AlreadyForwarded
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Streams_Exception_AlreadyForwarded', 'this invite has already been forwarded');
