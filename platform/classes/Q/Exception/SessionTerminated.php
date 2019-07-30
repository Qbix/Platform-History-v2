<?php

/**
 * @module Q
 */
class Q_Exception_SessionTerminated extends Q_Exception
{
	/**
	 * @class Q_Exception_SessionTerminated
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $id the id of the session
	 */
};

Q_Exception::add('Q_Exception_SessionTerminated', 'This session has been terminated. Try logging in again.', 403);
