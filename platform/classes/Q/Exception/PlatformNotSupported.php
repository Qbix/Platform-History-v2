<?php

/**
 * @module Q
 */
class Q_Exception_PlatformNotSupported extends Q_Exception
{
	/**
	 * @class Q_Exception_PlatformNotSupported
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $platform
	 */
};

Q_Exception::add('Q_Exception_PlatformNotSupported', 'the {{platform}} platform is not supported', 405);
