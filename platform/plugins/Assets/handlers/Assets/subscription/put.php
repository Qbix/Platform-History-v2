<?php

/**
 * @module Assets
 */

/**
 * Used by HTTP clients to start a subscription
 * @class HTTP Assets subscription
 * @method put
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.publisherId Required. Assets/plan stream publisher id.
 *  @param {String} $_REQUEST.streamName Required. Assets/plan stream name.
 */
function Assets_subscription_put($params = array())
{
    $req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('publisherId', 'streamName'), $req, true);
	
	// to be safe, we only start subscriptions from existing plans
	$planPublisherId = Q::ifset($req, 'publisherId', Users::communityId());
	$plan = Streams::fetchOne(null, $planPublisherId, $req['streamName'], true);

	$subscriptionStream = Assets_Subscription::getStream($plan);

	// check if subscription already paid
	if (!($subscriptionStream instanceof Streams_Stream) || !Assets_Subscription::isCurrent($subscriptionStream)) {
		throw new Exception("This subscription is not active");
	}

	// unsubscribe from assets plan
	if (Q_Request::slotName("unsubscribe")) {
		Assets_Subscription::stop($subscriptionStream);
		Q_Response::setSlot('unsubscribe', true);
	}
}