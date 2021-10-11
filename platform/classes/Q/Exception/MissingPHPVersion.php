<?php

/**
 * @module Q
 */
class Q_Exception_MissingPHPVersion extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingPHPVersion
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $version
	 */
};

Q_Exception::add('Q_Exception_MissingPHPVersion', 'PHP version should be at least $version', 501);
