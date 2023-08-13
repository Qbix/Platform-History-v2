<?php

/**
 * @module Streams
 */
class Streams_Exception_InviteExpired extends Q_Exception
{
	/**
	 * An exception is raised when participant is already invited to the stream
	 * @class Streams_Exception_InviteExpired
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Streams_Exception_InviteExpired', 'this invite has expired');
