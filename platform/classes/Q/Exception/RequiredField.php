<?php

/**
 * @module Q
 */
class Q_Exception_RequiredField extends Q_Exception
{
	/**
	 * @class Q_Exception_RequiredField
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $field
	 */
};

Q_Exception::add('Q_Exception_RequiredField', '{{field}} is required', 400);
