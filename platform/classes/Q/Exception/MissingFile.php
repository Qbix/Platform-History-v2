<?php

/**
 * @module Q
 */
class Q_Exception_MissingFile extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingFile
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $filename
	 */
};

Q_Exception::add('Q_Exception_MissingFile', 'missing file {{filename}}', 424);
