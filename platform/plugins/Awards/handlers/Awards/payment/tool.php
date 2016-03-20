<?php

/**
 * Standard tool for starting or managing subscriptions.
 * @class Awards subscription
 * @constructor
 * @param {array} $options Override various options for this tool
 *  @param {string} $options.payments can be "authnet" or "stripe"
 *  @param {string} $options.amount the amount to pay.
 *  @param {double} [$options.currency="usd"] the currency to pay in. (authnet supports only "usd")
 *  @param {string} [$options.payButton] Can override the title of the pay button
 *  @param {string} [$options.name=Users::communityName()] The name of the organization the user will be paying
 *  @param {string} [$options.image] The url pointing to a square image of your brand or product. The recommended minimum size is 128x128px.
 *  @param {string} [$options.description] A description of the product or service being purchased.
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
function Awards_payment_tool($options)
{
	Q_Valid::requireFields(array('payments', 'amount'), $options, true);
	if (empty($options['name'])) {
		$options['name'] = Users::communityName();
	}
	if (!empty($options['image'])) {
		$options['image'] = Q_Html::themedUrl($options['image']);
	}
	if (!empty($options['email'])) {
		$options['email'] = Users::loggedInUser(true)->emailAddress;
	}
	$payments = ucfirst($options['payments']);
	$lcpayments = strtolower($payments);
	$currency = strtolower(Q::ifset($options, 'currency', 'usd'));
	if ($payments === 'Authnet' and $currency !== 'usd') {
		throw new Q_Exception("Authnet doesn't support currencies other than USD", 'currency');
	}
	$className = "Awards_Payments_$payments";
	switch ($payments) {
		case 'Authnet':
			$adapter = new $className($options);
		    $token = $options['token'] = $adapter->authToken();
			$testing = $options['testing'] = Q_Config::expect('Awards', 'payments', $lcpayments, 'testing');
			$action = $options['action'] = $testing
				? "https://test.authorize.net/profile/manage"
				: "https://secure.authorize.net/profile/manage";
			break;
		case 'Stripe':
			$publishableKey = Q_Config::expect('Awards', 'payments', 'stripe', 'publishableKey');
			break;
	}
	$titles = array(
		'Authnet' => 'Authorize.net',
		'Stripe' => 'Stripe'
	);
	$payButton = Q::ifset($options, 'payButton', "Pay with " . $titles[$payments]);
    Q_Response::setToolOptions($options);
	return Q::view("Awards/tool/payment/$payments.php", compact(
		'token', 'publishableKey', 'action', 'payButton'
	));
};