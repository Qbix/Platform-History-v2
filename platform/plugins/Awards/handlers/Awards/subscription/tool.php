<?php

/**
 * Standard tool for starting or managing subscriptions.
 * @class Awards subscription
 * @constructor
 * @param {array} $options Override various options for this tool
 *  @param {string} $options.payments can be "authnet" or "stripe"
 *  @param {string} $options.planStreamName the name of the subscription plan's stream
 *  @param {string} [$options.publisherId=Q.Users.communityId] the publisher of the subscription plan's stream
 *  @param {double} [$options.amount] specify the amount (optional cents after the decimal point)
 *  @param {string} [$currency='usd'] set the currency, which will affect the amount (authnet doesn't support this)
 *  @param {array} [$options=array()] Any additional options
 *  @param {string} [$options.token=null] required unless the user is an existing customer
 *  @param {string} [$options.description=null] description of the charge, to be sent to customer
 *  @param {string} [$options.metadata=null] any additional metadata to store with the charge
 *  @param {string} [$options.subscription=null] if this charge is related to a subscription stream
 *  @param {string} [$options.subscription.publisherId]
 *  @param {string} [$options.subscription.streamName]
 */
function Awards_subscription_tool($options)
{
	if (empty($options['payments'])) {
		throw new Q_Exception_RequiredField(array('field' => 'payments'), 'payments');
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
	$subscribeButton = Q::ifset($options, 'subscribeButton', "Subscribe with " . $titles[$payments]);
    Q_Response::setToolOptions($options);
	Q_Response::addStylesheet('plugins/Awards/css/Awards.css');
	return Q::view("Awards/tool/subscription/$payments.php", compact(
		'token', 'publishableKey', 'action',
		'paymentButton', 'subscribeButton', 'planStreamName'
	));
};