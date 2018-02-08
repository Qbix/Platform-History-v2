<?php

/**
 * HTTP method for starting a payment
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.payments Required. Should be either "authnet" or "stripe"
 *  @param {String} [$_REQUEST.publisherId=Q.Users.communityId] The publisherId of the Assets/product or Assets/service stream
 *  @param {String} [$_REQUEST.streamName] The name of the Assets/product or Assets/service stream
 *  @param {Number} [$_REQUEST.description] A short name or description of the product or service being purchased.
 *  @param {Number} [$_REQUEST.amount] the amount to pay. 
 *  @param {String} [$_REQUEST.currency="usd"] the currency to pay in. (authnet supports only "usd")
 *  @param {String} [$_REQUEST.token] the token obtained from the hosted forms
 */
function Assets_stripeWebhook_post()
{
	$secretKey = Q_Config::get('Assets', 'payments', 'stripe', 'secret', null);
	if (!$secretKey) {
		return;
	}
	\Stripe\Stripe::setApiKey($secretKey);
	// Retrieve the request's body and parse it as JSON
	$input = @file_get_contents("php://input");
	$event_json = json_decode($input, true);
	if ($event_json['type'] === 'charge.succeeded') {
		$metadata =& $event_json['data']['object']['metadata'];
		if (!empty($metadata) && $metadata['streamName']) {
			$arr = explode('/', $metadata['streamName']);
			array_pop($arr);
			$streamName = implode('/', $arr);
			switch($streamName) {
				case 'Calendars/event';
					break;
				default:
			}
			Q::event('Calendars/event/webhook/Stripe/charge', $metadata);
		}
	};
	http_response_code(200); // PHP 5.4 or greater
	exit;
}