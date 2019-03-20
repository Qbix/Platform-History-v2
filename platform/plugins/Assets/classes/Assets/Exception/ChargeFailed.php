<?php

/**
 * @module Assets
 */
class Assets_Exception_ChargeFailed extends Q_Exception
{
	/**
	 * The charge failed for some other reason
	 * @class Assets_Exception_ChargeFailed
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Assets_Exception_ChargeFailed', 'The attempt to charge failed');
