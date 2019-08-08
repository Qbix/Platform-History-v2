<?php

/**
 * @module Q
 */
class Q_Exception_DispatcherForward extends Q_Exception
{
	/**
	 * @class Q_Exception_DispatcherForward
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add(
	'Q_Exception_DispatcherForward', 
	'Dispatcher is forwarding to $uri',
	null,
	array('Q_Dispatcher')
);
