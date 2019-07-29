<?php

/**
 * @module Q
 */
class Q_Exception_MissingRoute extends Q_Exception
{
	/**
	 * @class Q_Exception_MissingRoute
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $route_pattern
	 */
};

Q_Exception::add('Q_Exception_MissingRoute', 'missing route {{route_pattern}}', 424);
