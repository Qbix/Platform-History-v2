<?php

/**
 * @module Q
 */
class Q_Exception_SessionHijacked extends Q_Exception
{
	/**
	 * @class Q_Exception_SessionHijacked
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $id the id of the session
	 */
};

Q_Exception::add('Q_Exception_SessionHijacked', 'This session was started on another device. Try logging in again.', 403);
