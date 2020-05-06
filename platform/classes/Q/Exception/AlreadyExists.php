<?php

/**
 * @module Q
 */
class Q_Exception_AlreadyExists extends Q_Exception
{
	/**
	 * @class Q_Exception_AlreadyExists
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $source
	 */
};

Q_Exception::add('Q_Exception_AlreadyExists', '{{source}} already exists');
