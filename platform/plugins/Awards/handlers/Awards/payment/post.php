<?php

/**
 * HTTP method for starting a payment
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.payments Required. Should be either "authnet" or "stripe"
 *  @param {String} $_REQUEST.planStreamName the name of the subscription plan's stream
 *  @param {String} [$_REQUEST.planPublisherId=Users::communityId()] the publisher of the subscription plan's stream
 */
function Awards_payment_post($params = array())
{
    $req = array_merge($_REQUEST, $params);
	
	// to be safe, we only start subscriptions from existing plans
	$planPublisherId = Q::ifset($req, 'planPublisherId', Users::communityId());
	$plan = Streams::fetchOne($planPublisherId, $planPublisherId, $req['planStreamName'], true);
	
	// the currency will always be assumed to be "USD" for now
	// and the amount will always be assumed to be in dollars, for now
	
	$subscription = Awards::startSubscription($plan, $req['payments']);
	Q_Response::setSlot('subscription', $subscription);
}