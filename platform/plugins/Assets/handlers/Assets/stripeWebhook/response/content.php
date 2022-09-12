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

			// need to response http code 200 to stripe endpoint regardless of processing our engine
			// because regardless of our exceptions we got payment_intent.succeeded event
			// otherwise stripe will block our webhook
			try {
				Assets_stripeWebhook_log('Payment success!', $paymentIntent);

				$amount = (int)Q::ifset($paymentIntent, "amount", null);
				$amount /= 100; // amount in cents, need to convert to dollars
				$currency = Q::ifset($paymentIntent, "currency", null);
				$metadata = (array)Q::ifset($paymentIntent, "metadata", array());

				// set user to metadata
				$userId = Q::ifset($metadata, "userId", null);
				if ($userId) {
					$user = Users::fetch($userId, true);
					$metadata["user"] = $user;
				}

				// set payment id to metadata
				$chargeId = Q::ifset($paymentIntent, "id", null);
				if ($chargeId) {
					$metadata["chargeId"] = $chargeId;
				}

				// set stream to metadata
				$publisherId = Q::ifset($metadata, "publisherId", null);
				$streamName = Q::ifset($metadata, "streamName", null);
				if ($publisherId && $streamName) {
					$metadata["stream"] = Streams::fetchOne($publisherId, $publisherId, $streamName);
				}

				Assets::charge("stripe", $amount, $currency, $metadata);
			} catch (Exception $e) {
				Assets_stripeWebhook_log("Exception occur during process payment intent", $e);
			}

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