<?php

/**
 * @module Streams
 */
class Streams_Exception_AttributesLocked extends Q_Exception
{
	/**
	 * An exception is raised when locked attributes on a stream are modified
	 * @class Streams_Exception_AttributesLocked
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Streams_Exception_AttributesLocked', 'attributes locked: {{attributes}}');
