<?php
function Assets_stripe_response_content ($params) {
	$request = array_merge($_REQUEST, $params);

	$paymentIntentClientSecret = Q::ifset($request, "payment_intent_client_secret", null);
	$publishableKey = Q_Config::expect("Assets", "payments", "stripe", "publishableKey");
	die(Q::view('Assets/content/stripe_checkout.php', compact("publishableKey", "paymentIntentClientSecret")));
}