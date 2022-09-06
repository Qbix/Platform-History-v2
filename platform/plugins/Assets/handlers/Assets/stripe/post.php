<?php
/**
 * Stripe webhook https://stripe.com/docs/webhooks
 */
function Assets_stripe_post() {
	$secretKey = Q_Config::get('Assets', 'payments', 'stripe', 'secret', null);
	if (!$secretKey) {
		return;
	}
	\Stripe\Stripe::setApiKey($secretKey);
	$input = @file_get_contents("php://input");
	$event_json = json_decode($input, true);

	// charge.succeeded event
	if ($event_json['type'] === 'charge.succeeded') {
		$metadata =& $event_json['data']['object']['metadata'];
		if (!empty($metadata) && $metadata['streamName']) {
			$arr = explode('/', $metadata['streamName']);
			array_pop($arr);
			$streamName = implode('/', $arr);
			Q::event('Calendars/event/webhook/Stripe/charge', $event_json);
		}
	};

	http_response_code(200); // PHP 5.4 or greater
	exit;
}