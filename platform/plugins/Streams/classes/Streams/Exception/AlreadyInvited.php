<?php

/**
 * @module Streams
 */
class Streams_Exception_AlreadyInvited extends Q_Exception
{
	/**
	 * An exception is raised when participant is already invited to the stream
	 * @class Streams_Exception_AlreadyInvited
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Streams_Exception_AlreadyInvited', 'you have already invited them to this stream');
