<?php
require ASSETS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

/**
 * Stripe webhook https://stripe.com/docs/webhooks
 */
function Assets_stripeWebhook_response_content ($params) {
	$payload = @file_get_contents('php://input');
	$event = null;
	$endpoint_secret = Q_Config::expect("Assets", "payments", "stripe", "webhookSecret");

	try {
		$event = \Stripe\Event::constructFrom(json_decode($payload, true));
	} catch(\UnexpectedValueException $e) {
		// Invalid payload

		Assets_stripeWebhook_log('Webhook error while parsing basic request.', $e);
		http_response_code(400);
		exit();
	}

	// Only verify the event if there is an endpoint secret defined
	// Otherwise use the basic decoded event
	$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
	try {
		$event = \Stripe\Webhook::constructEvent($payload, $sig_header, $endpoint_secret);
	} catch(\Stripe\Exception\SignatureVerificationException $e) {
		// Invalid signature
		Assets_stripeWebhook_log('Webhook error while validating signature.', $e);
		http_response_code(400);
		exit();
	}

	// Handle the event
	switch ($event->type) {
		case 'payment_intent.succeeded':
			$paymentIntent = $event->data->object; // contains a \Stripe\PaymentIntent
			// Then define and call a method to handle the successful payment intent.
			// handlePaymentIntentSucceeded($paymentIntent);

			Assets_stripeWebhook_log('Payment success!', $paymentIntent);

			$amount = (int)Q::ifset($paymentIntent, "amount", null);
			$amount /= 100; // amount in cents, need to convert to dollars
			$currency = Q::ifset($paymentIntent, "currency", null);
			$metadata = (array)Q::ifset($paymentIntent, "metadata", array());
			$userId = Q::ifset($paymentIntent, "metadata", "userId", null);
			if ($userId) {
				$user = Users::fetch($userId, true);
				$metadata["user"] = $user;
			}
			$publisherId = Q::ifset($paymentIntent, "metadata", "publisherId", null);
			$streamName = Q::ifset($paymentIntent, "metadata", "streamName", null);
			if ($publisherId && $streamName) {
				$metadata["stream"] = Streams::fetchOne($publisherId, $publisherId, $streamName);
			}

			Assets::charge("stripe", $amount, $currency, $metadata);

			break;
		default:
			Assets_stripeWebhook_log('Received unknown event type ' . $event->type);
	}

	http_response_code(200); // PHP 5.4 or greater
	exit;
}

function Assets_stripeWebhook_log ($title, $message=null) {
	Q::log('______________________________________________', "Stripe.webhook");
	Q::log($title, "Stripe.webhook");
	if ($message) {
		Q::log($message, "Stripe.webhook");
	}
}