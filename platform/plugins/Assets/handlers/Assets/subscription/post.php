<?php

/**
 * @module Assets
 */

/**
 * Used by HTTP clients to start a subscription
 * @class HTTP Assets subscription
 * @method post
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.payments Required. Should be either "authnet" or "stripe"
 *  @param {String} $_REQUEST.planStreamName the name of the subscription plan's stream
 *  @param {String} [$_REQUEST.planPublisherId=Users::communityId()] the publisher of the subscription plan's stream
 */
function Assets_subscription_post($params = array())
{
    $req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('payments', 'planStreamName'), $req, true);
	
	// to be safe, we only start subscriptions from existing plans
	$planPublisherId = Q::ifset($req, 'planPublisherId', Users::communityId());
	$plan = Streams::fetchOne($planPublisherId, $planPublisherId, $req['planStreamName'], true);

	$subscriptionStream = Assets_Subscription::getStream($plan);

	// check if subscription already paid
	if ($subscriptionStream && Assets_Subscription::isCurrent($subscriptionStream)) {
		throw new Exception("This subscription already paid");
	}

	// try to charge funds
	// if charge fail it will lead to start payment flow on client
	$subscription = Q::event('Assets/payment/post', array(
		'payments' => $req['payments'],
		'amount' => $plan->getAttribute('amount'),
		'currency' => $plan->getAttribute('currency', 'USD'),
		'description' => $plan->title,
		'publisherId' => $planPublisherId,
		'streamName' => $req['planStreamName']
	));

	// the currency will always be assumed to be "USD" for now
	// and the amount will always be assumed to be in dollars, for now
	Q_Response::setSlot('subscription', $subscription);
}