<?php

/**
 * Create Stripe payment intent
 * @class Assets payment
 * @constructor
 * @param {array} $options Override various options for this tool
 *  @param {string} $options.amount the amount to pay.
 *  @param {double} [$options.currency="usd"] the currency to pay in. (authnet supports only "usd")
 */
function Assets_payment_response_intent($options)
{
	$options = array_merge($_REQUEST, $options);

	Q_Valid::requireFields(array('amount'), $options, true);

	$options['currency'] = Q::ifset($options, 'currency', 'usd');
	$metadata = Q::ifset($options, 'metadata', array());
	$metadata['token'] = uniqid();

	$stripe = new Assets_Payments_Stripe();
	$paymentIntent = $stripe->createPaymentIntent($options['amount'], $options['currency'], array(
		"metadata" => $metadata
	));

	return array(
		'client_secret' => $paymentIntent->client_secret,
		'token' => $paymentIntent->metadata->token
	);
};