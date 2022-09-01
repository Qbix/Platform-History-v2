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
 *  @param {String} [$_REQUEST.token=null] if using stripe, pass the token here
 */
function Assets_subscription_post($params = array())
{
    $req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('payments'), $req, true);
	
	// to be safe, we only start subscriptions from existing plans
	$planPublisherId = Q::ifset($req, 'planPublisherId', Users::communityId());
	$plan = Streams_Stream::fetch($planPublisherId, $planPublisherId, $req['planStreamName'], true);
	
	// the currency will always be assumed to be "USD" for now
	// and the amount will always be assumed to be in dollars, for now
	$token = Q::ifset($req, 'token', null);
	$subscription = Assets_Subscription::start($plan, $req['payments'], @compact('token'));
	Q_Response::setSlot('subscription', $subscription);
}