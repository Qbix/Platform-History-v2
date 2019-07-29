<?php

/**
 * @module Q
 */
class Q_Exception_MissingRow extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingRow
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $table
	 * @param {string} $criteria
	 */
};

Q_Exception::add('Q_Exception_MissingRow', 'Missing {{table}} with {{criteria}}.', 404);
