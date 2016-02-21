<?php

/**
 * @module Awards
 */
class Awards_Exception_ChargeFailed extends Q_Exception
{
	/**
	 * The charge failed for some other reason
	 * @class Awards_Exception_ChargeFailed
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Awards_Exception_ChargeFailed', 'The attempt to charge failed');
