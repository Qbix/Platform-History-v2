<?php

/**
 * @module Streams
 */
class Streams_Exception_AlreadyDeclined extends Q_Exception
{
	/**
	 * An exception is raised when the invite was already declined
	 * @class Streams_Exception_AlreadyDeclined
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Streams_Exception_AlreadyDeclined', 'this invite has already been declined');
