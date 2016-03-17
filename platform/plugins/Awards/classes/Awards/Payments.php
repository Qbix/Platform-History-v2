<?php

abstract class Awards_Payments
{
	// common functionality could go here
}

interface iAwards_Payments
{
	/**
	* Interface class for Awards_Payments adapters
	* @class Awards_Payments
	* @param {array} [$options=array()] Any initial options
 	* @param {Users_User} [$options.user=Users::loggedInUser()] Allows us to set the user to charge
	* @constructor
	*/
	function __construct($options = array());

	/**
	 * Make a one-time charge using the payments processor
	 * @method charge
	 * @param {double} $amount specify the amount (optional cents after the decimal point)
	 * @param {string} [$currency='usd'] set the currency, which will affect the amount
	 * @param {array} [$options=array()] Any additional options
	 * @param {string} [$options.description=null] description of the charge, to be sent to customer
	 * @param {string} [$options.metadata=null] any additional metadata to store with the charge
	 * @param {string} [$options.subscription=null] if this charge is related to a subscription stream
	 * @param {string} [$options.subscription.publisherId]
	 * @param {string} [$options.subscription.streamName]
	 * @throws \Stripe\Error\Card
	 * @throws Awards_Exception_DuplicateTransaction
	 * @throws Awards_Exception_HeldForReview
	 * @throws Awards_Exception_ChargeFailed
	 * @return {Awards_Charge} the saved database row corresponding to the charge
	 */
	function charge($amount, $currency = 'usd', $options = array());

	/**
	* Executes some API calls and obtains a customer id that unifies payment profile ids
	* @method customerId
	* @return {string} The customer id
	*/
	function customerId();

	/**
	* Executes some API calls and obtains a payment profile id
	* @method paymentProfileId
	* @return {string} The payment profile id
	*/
	function paymentProfileId($customerId);
}