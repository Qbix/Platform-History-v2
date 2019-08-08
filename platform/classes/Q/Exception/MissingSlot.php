<?php

/**
 * @module Q
 */
class Q_Exception_MissingSlot extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingSlot
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $event
	 */
};

Q_Exception::add('Q_Exception_MissingSlot', 'missing slot event {{event}}', 424);
