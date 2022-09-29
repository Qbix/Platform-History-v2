<?php

/**
 * HTTP method for starting a payment. Requires a user to be logged in.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.payments Required. Should be either "authnet" or "stripe"
 *  @param {String} [$_REQUEST.publisherId=Q.Users.communityId] The publisherId of the Assets/product or Assets/service stream
 *  @param {String} [$_REQUEST.streamName] The name of the Assets/product or Assets/service stream
 *  @param {Number} [$_REQUEST.description] A short name or description of the product or service being purchased.
 *  @param {Number} [$_REQUEST.amount] the amount to pay. 
 *  @param {String} [$_REQUEST.currency="usd"] the currency to pay in. (authnet supports only "usd")
 *  @param {String} [$_REQUEST.token] the token obtained from the hosted forms
 */
function Assets_payment_post($params = array())
{
    $req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('payments', 'amount'), $req, true);
	// to be safe, we only start subscriptions from existing plans
	$publisherId = Q::ifset($req, 'publisherId', null);
	$streamName = Q::ifset($req, 'streamName', null);
	$stream = null;
	if ($publisherId and $streamName) {
		$stream = Streams_Stream::fetch($publisherId, $publisherId, $streamName, true);
	}
	$userId = Users::loggedInUser(true)->id;

	// the currency will always be assumed to be "USD" for now
	// and the amount will always be assumed to be in dollars, for now
	$currency = Q::ifset($req, 'currency', 'USD');
	$user = Users::fetch($userId, true);
	$description = Q::ifset($req, 'description', null);
	$metadata = array(
		'streamName' => $streamName,
		'publisherId' => $publisherId,
		'userId' => $userId
	);

	// need to set false because null will lead to unset slot because isset(null)=false
	$charge = false;
	try {
		$charge = Assets::charge($req['payments'], $req['amount'], $currency, @compact('user', 'description', 'metadata'));
	} catch (Exception $e) {

	}

	if ($charge && $stream && $stream->type === 'Assets/subscription') {
		$stream->setAttribute('lastChargeTime', time());
		$stream->changed();
	}

	Q_Response::setSlot('charge', $charge);
}