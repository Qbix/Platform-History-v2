<?php

/**
 * @module Streams
 */
class Streams_Exception_RestrictedAttribute extends Q_Exception
{
	/**
	 * The attribute name is restrictied
	 * @class Streams_Exception_RestrictedAttribute
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $attributeName
	 *	The name of the attribute
	 */	
};

Q_Exception::add('Streams_Exception_RestrictedAttribute', 'Attribute is restricted: {{attributeName}}');
