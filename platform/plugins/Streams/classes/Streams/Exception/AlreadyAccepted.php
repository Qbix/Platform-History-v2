<?php

/**
 * @module Streams
 */
class Streams_Exception_AlreadyAccepted extends Q_Exception
{
	/**
	 * An exception is raised when the invite was already accepted
	 * @class Streams_Exception_AlreadyAccepted
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Streams_Exception_AlreadyAccepted', 'this invite was already accepted');
