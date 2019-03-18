<?php

abstract class Assets_Payments
{
	// common functionality could go here
}

interface Assets_Payments_Interface
{
	/**
	* Interface class for Assets_Payments adapters
	* @class Assets_Payments
	* @param {array} [$options=array()] Any initial options
 	* @param {Users_User} [$options.user=Users::loggedInUser()] Allows us to set the user to charge
	* @constructor
	*/
	function __construct($options = array());

	/**
	 * Make a one-time charge using the payments processor
	 * @method charge
	 * @param {double} $amount specify the amount (optional cents after the decimal point)
	 * @param {string} [$currency='USD'] set the currency, which will affect the amount
	 * @param {array} [$options=array()] Any additional options
	 * @param {string} [$options.description=null] description of the charge, to be sent to customer
	 * @param {string} [$options.metadata=null] any additional metadata to store with the charge
	 * @param {string} [$options.subscription=null] if this charge is related to a subscription stream
	 * @param {string} [$options.subscription.publisherId]
	 * @param {string} [$options.subscription.streamName]
	 * @throws \Stripe\Error\Card
	 * @throws Assets_Exception_DuplicateTransaction
	 * @throws Assets_Exception_HeldForReview
	 * @throws Assets_Exception_ChargeFailed
	 * @return {Assets_Charge} the saved database row corresponding to the charge
	 */
	function charge($amount, $currency = 'USD', $options = array());
}