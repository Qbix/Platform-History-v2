<?php

/**
 * @module Q
 */
class Q_Exception_DbQuery extends Q_Exception
{
	/**
	 * @class Q_Exception_DbQuery
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $message
	 * @param {string} $sql
	 */
};

Q_Exception::add('Q_Exception_DbQuery', 'DbQuery Exception: {{msg}} ... Query was: {{sql}}');
