<?php

/**
 * Standard tool for starting or managing subscriptions.
 * @class Awards subscription
 * @constructor
 * @param {array} $options Override various options for this tool
 *  @param {string} $options.payments can be "authnet" or "stripe"
 *  @param {string} $options.planStreamName the name of the subscription plan's stream
 *  @param {string} [$options.publisherId=Q.Users.communityId] the publisher of the subscription plan's stream
 */
function Awards_payment_tool($options)
{
	if (empty($options['payments'])) {
		throw new Q_Exception_RequiredField(array('field' => 'payments'));
	}
	$payments = ucfirst($options['payments']);
	$className = "Awards_Payments_$payments";
	switch ($payments) {
		case 'Authnet':
			$adapter = new $className($options);
		    $token = $adapter->authToken();
			break;
		case 'Stripe':
			$publishableKey = Q_Config::expect('Awards', 'payments', 'stripe', 'publishableKey');
			break;
	}
	$paymentButton = Q::ifset($options, 'paymentButton', 'Payment Info');
	$subscribeButton = Q::ifset($options, 'subscribeButton', 'Start Subscription');
    Q_Response::setToolOptions($options);
	return Q::view("Awards/tool/subscription/$payments.php", compact(
		'token', 'publishableKey',
		'paymentButton', 'subscribeButton', 'planStreamName'
	));
};