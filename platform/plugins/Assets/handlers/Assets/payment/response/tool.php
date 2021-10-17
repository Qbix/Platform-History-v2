<?php

/**
 * Standard tool for making payments.
 * @class Assets payment
 * @constructor
 * @param {array} $options Override various options for this tool
 *  @param {string} $options.payments can be "authnet" or "stripe"
 *  @param {string} $options.amount the amount to pay.
 *  @param {double} [$options.currency="usd"] the currency to pay in. (authnet supports only "usd")
 *  @param {string} [$options.payButton] Can override the title of the pay button
 *  @param {String} [$options.publisherId=Users::communityId()] The publisherId of the Assets/product or Assets/service stream
 *  @param {String} [$options.streamName] The name of the Assets/product or Assets/service stream
 *  @param {string} [$options.name=Users::communityName()] The name of the organization the user will be paying
 *  @param {string} [$options.image] The url pointing to a square image of your brand or product. The recommended minimum size is 128x128px.
 *  @param {string} [$options.description=null] A short name or description of the product or service being purchased.
 *  @param {string} [$options.panelLabel] The label of the payment button in the Stripe Checkout form (e.g. "Pay {{amount}}", etc.). If you include {{amount}}, it will be replaced by the provided amount. Otherwise, the amount will be appended to the end of your label.
 *  @param {string} [$options.zipCode] Specify whether Stripe Checkout should validate the billing ZIP code (true or false). The default is false.
 *  @param {boolean} [$options.billingAddress] Specify whether Stripe Checkout should collect the user's billing address (true or false). The default is false.
 *  @param {boolean} [$options.shippingAddress] Specify whether Checkout should collect the user's shipping address (true or false). The default is false.
 *  @param {string} [$options.email=Users::loggedInUser(true)->emailAddress] You can use this to override the email address, if any, provided to Stripe Checkout to be pre-filled.
 *  @param {boolean} [$options.allowRememberMe=true] Specify whether to include the option to "Remember Me" for future purchases (true or false).
 *  @param {boolean} [$options.bitcoin=false] Specify whether to accept Bitcoin (true or false). 
 *  @param {boolean} [$options.alipay=false] Specify whether to accept Alipay ('auto', true, or false). 
 *  @param {boolean} [$options.alipayReusable=false] Specify if you need reusable access to the customer's Alipay account (true or false).
 */
function Assets_payment_response_tool($options)
{
	$options = array_merge($_REQUEST, $options);
	$supportedPayment = array('Authnet', 'Stripe');

	Q_Valid::requireFields(array('payments'), $options, true);
	$payments = $options["payments"];
	$currency = $options["currency"];

	if (!in_array($payments, $supportedPayment)) {
		throw new Q_Exception("Unsupported payment method ".$payments.". Supported methods are: ".join(',', $supportedPayment));
	}

	$className = "Assets_Payments_$payments";
	switch ($payments) {
		case 'Authnet':
			$adapter = new $className($options);
		    $token = $adapter->authToken();
			$testing = Q_Config::expect('Assets', 'payments', $payments, 'testing');
			$action = $testing ? "https://test.authorize.net/profile/manage" : "https://secure.authorize.net/profile/manage";
			break;
		case 'Stripe':
			$publishableKey = Q_Config::expect('Assets', 'payments', 'stripe', 'publishableKey');
			break;
	}

	$symbol = Assets::currency($currency);

	$text = Q_Text::get('Assets/content');

	return @compact('token', 'action', 'publishableKey', 'symbol', 'text');
};