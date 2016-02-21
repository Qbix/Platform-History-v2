<?php

/**
 * @module Q
 */
class Q_Exception_SendingToNode extends Q_Exception
{
	/**
	 * @class Q_Exception_SendingToNode
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $by
	 * @param {string} $plugin
	 * @param {string} $version
	 */
};

Q_Exception::add('Q_Exception_SendingToNode', 'Error sending {{method}} message to Node. Please try again later.');
