<?php

/**
 * @module Q
 */
class Q_Exception_NoConnection extends Q_Exception
{
	/**
	 * @class Q_Exception_NoConnection
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $server
	 */
};

Q_Exception::add('Q_Exception_NoConnection', 'no connection to {{server}}', 421);
