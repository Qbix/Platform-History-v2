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

	$text = Q_Text::get("Assets/content");

	// to be safe, we only start subscriptions from existing plans
	$planPublisherId = Q::ifset($req, 'planPublisherId', Users::communityId());
	$plan = Streams::fetchOne($planPublisherId, $planPublisherId, $req['planStreamName'], true);

	$subscriptionStream = Assets_Subscription::getStream($plan);

	// check if subscription already paid
	if ($subscriptionStream && Assets_Subscription::isCurrent($subscriptionStream)) {
		throw new Exception($text["subscriptions"]["SubscriptionAlreadyPaid"]);
	}

	$forcePayment = filter_var(Q::ifset($req, "immediatePayment", false), FILTER_VALIDATE_BOOLEAN);
	Q::event("Assets/credits/post", array(
		"amount" => $plan->getAttribute('amount'),
		"currency" => $plan->getAttribute('currency', 'USD'),
		"toStream" => $plan,
		"forcePayment" => $forcePayment
	));

	$subscriptionStream = Assets_Subscription::getStream($plan);
	if ($subscriptionStream) {
		Q_Response::setSlot("subscriptionStream", array(
			"publisherId" => $subscriptionStream->publisherId,
			"streamName" => $subscriptionStream->name
		));
	} else {
		Q_Response::setSlot("subscriptionStream", false);
	}

	// try to charge funds
	// if charge fail it will lead to start payment flow on client
	/*$subscription = Q::event('Assets/payment/post', array(
		'payments' => $req['payments'],
		'amount' => $plan->getAttribute('amount'),
		'currency' => $plan->getAttribute('currency', 'USD'),
		'description' => $plan->title,
		'publisherId' => $planPublisherId,
		'streamName' => $req['planStreamName']
	));*/
}