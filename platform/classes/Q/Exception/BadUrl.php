<?php

/**
 * @module Q
 */
class Q_Exception_BadUrl extends Q_Exception
{
	/**
	 * @class Q_Exception_BadUrl
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $url
	 * @param {string} $base_url
	 */
};

Q_Exception::add('Q_Exception_BadUrl', 'bad url {{url}} (the base url is {{base_url}})');
