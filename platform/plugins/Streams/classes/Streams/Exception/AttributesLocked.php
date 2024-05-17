<?php

/**
 * @module Streams
 */
class Streams_Exception_AttributesLocked extends Q_Exception
{
	/**
	 * The attributes are locked
	 * @class Streams_Exception_AttributesLocked
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $attributes
	 *	Comma-separated list of attribute names
	 */	
};

Q_Exception::add('Streams_Exception_AttributesLocked', 'Attributes are locked: {{attributes}}');
