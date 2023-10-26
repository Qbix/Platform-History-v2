<?php

/**
 * @module Q
 */
class Q_Exception_ProviderErrors extends Q_Exception
{
	/**
	 * @class Q_Exception_ProviderErrors
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $code
	 * @param {string} $message
	 */
};

Q_Exception::add('Q_Exception_ProviderErrors', 'Provider return error with code: "{{code}}" and message "{{message}}"');
