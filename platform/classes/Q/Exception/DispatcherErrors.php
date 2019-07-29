<?php

/**
 * @module Q
 */
class Q_Exception_DispatcherErrors extends Q_Exception
{
	/**
	 * @class Q_Exception_DispatcherErrors
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add(
	'Q_Exception_DispatcherErrors', 
	'Dispatcher is displaying errors',
	null,
	array('Q_Dispatcher')
);
