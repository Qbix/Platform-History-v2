<?php

/**
 * Standard tool for starting or managing subscriptions.
 * @class Assets subscription
 * @constructor
 * @param {array} $options Override various options for this tool
 *  @param {string} $options.payments can be "authnet" or "stripe"
 *  @param {string} $options.planStreamName the name of the subscription plan's stream
 *  @param {string} [$options.publisherId=Users::communityId()] the publisher of the subscription plan's stream
 *  @param {string} [$options.subscribeButton] Can override the title of the subscribe button
 *  @param {array} [$options=array()] Any additional options
 *  @param {string} [$options.token=null] required unless the user is an existing customer
 */
function Assets_subscription_tool($options)
{
	if (empty($options['payments'])) {
		throw new Q_Exception_RequiredField(array('field' => 'payments'), 'payments');
	}
	$payments = ucfirst($options['payments']);
	$lcpayments = mb_strtolower($payments, 'UTF-8');
	$currency = strtolower(Q::ifset($options, 'currency', 'usd'));
	if ($payments === 'Authnet' and $currency !== 'usd') {
		throw new Q_Exception("Authnet doesn't support currencies other than USD", 'currency');
	}
	$className = "Assets_Payments_$payments";
	switch ($payments) {
		case 'Authnet':
			$adapter = new $className($options);
		    $token = $options['token'] = $adapter->authToken();
			$testing = $options['testing'] = Q_Config::expect('Assets', 'payments', $lcpayments, 'testing');
			$action = $options['action'] = $testing
				? "https://test.authorize.net/profile/manage"
				: "https://secure.authorize.net/profile/manage";
			break;
		case 'Stripe':
			$publishableKey = Q_Config::expect('Assets', 'payments', 'stripe', 'publishableKey');
			break;
	}
	$titles = array(
		'Authnet' => 'Authorize.net',
		'Stripe' => 'Stripe'
	);
	$subscribeButton = Q::ifset($options, 'subscribeButton', "Subscribe with " . $titles[$payments]);
    Q_Response::setToolOptions($options);
	return Q::view("Assets/tool/subscription/$payments.php", @compact(
		'token', 'publishableKey', 'action',
		'paymentButton', 'subscribeButton', 'planStreamName'
	));
};