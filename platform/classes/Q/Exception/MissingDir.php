<?php

/**
 * @module Q
 */
class Q_Exception_MissingDir extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingDir
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $dirname
	 */
};

Q_Exception::add('Q_Exception_MissingDir', 'missing directory {{dirname}}', 424);
