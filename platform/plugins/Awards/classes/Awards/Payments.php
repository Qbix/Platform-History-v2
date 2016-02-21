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
	* @constructor
	*/
	function __construct($options = array());

	/**
	* Make a one-time charge using the payments processor
	* @method charge
	* @param {string} [$customerId=null] specify a customer id
	* @param {string} [$paymentProfileId=null] specify a payment profile
	* @throws Awards_Exception_DuplicateTransaction
	* @throws Awards_Exception_HeldForReview
	* @throws Awards_Exception_ChargeFailed
	* @return {Awards_Charge} the saved database row corresponding to the charge
	*/
	function charge($customerId = null, $paymentProfileId = null);

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