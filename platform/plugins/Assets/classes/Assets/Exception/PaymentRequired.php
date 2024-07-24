<?php

/**
 * @module Assets
 */
class Assets_Exception_PaymentRequired extends Q_Exception
{
	/**
	 * Payment is required to access this
	 * @class Assets_Exception_PaymentRequired
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Assets_Exception_PaymentRequirement', 'Payment is needed to access this.');
