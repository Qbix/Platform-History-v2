<?php

/**
 * @module Assets
 */
class Assets_Exception_PaymentMethodRequired extends Q_Exception
{
	/**
	 * A payment method should be registered with a payment processor
	 * @class Assets_Exception_PaymentMethodRequired
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Assets_Exception_PaymentMethodRequired', 'Please add a valid payment method');
