<?php
	
function Assets_dashboard_response_content()
{
	$user = Users::loggedInUser(true);

	if (!Users::roles(null, array('Users/owners'), array(), $user->id)) {
		throw new Users_Exception_NotAuthorized();
	}

	$stripeClientId = Q_Config::expect("Assets", "payments", "stripe", "clientId");
	$stripeConnectLink = Q_Config::expect("Assets", "payments", "stripe", "connectLink");
	$secretKey = Q_Config::expect('Assets', 'payments', 'stripe', 'secret');

	$nonce = Q_Session::calculateNonce();

	$redirectUrl = Q_Request::baseUrl().'/Q/plugins/Assets/dashboard';

	$connectedAccount = new Assets_Connected();
	$connectedAccount->userId = Q::app();
	$connectedAccount->processor = 'stripe';

	// stripe replied with AUTHORIZATION_CODE
	if ($code = $_GET['code']) {
		if ($_GET['state'] != $nonce) {
			exit;
		}

		\Stripe\Stripe::setApiKey($secretKey);

		$response = \Stripe\OAuth::token([
			'grant_type' => 'authorization_code',
			'code' => $code,
		]);

		if ($response->error) {
			throw new Exception($response->error_description);
		}

		if (empty($response->stripe_user_id)) {
			throw new Exception("Unexpected error");
		}

		// Access the connected account id in the response
		$connectedAccount->accountId = $response->stripe_user_id;
		$connectedAccount->refreshToken = $response->refresh_token;
		if (!$connectedAccount->retrieve()) {
			$connectedAccount->save();
		}

		return Q_Response::redirect($redirectUrl);
	}

	$connectedAccountId = null;
	if ($connectedAccount->retrieve()) {
		$connectedAccountId = $connectedAccount->accountId;
	}

	if ($connectedAccountId) {
		die($connectedAccountId);
	}

	$stripeConnectLink = Q::interpolate($stripeConnectLink, array(
		'redirect_uri' => $redirectUrl,
		'client_id' => $stripeClientId,
		'state' => $nonce
	));

	return Q::view('Assets/content/dashboard.php', compact("stripeConnectLink"));
}