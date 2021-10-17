<?php
	
function Assets_connected_response_content()
{
	$user = Users::loggedInUser(true);

	if (!Users::roles(null, array('Users/owners'), array(), $user->id)) {
		throw new Users_Exception_NotAuthorized();
	}

	$stripeClientId = Q_Config::expect("Assets", "payments", "stripe", "clientId");
	$stripeConnectLink = Q_Config::expect("Assets", "payments", "stripe", "connectLink");

	$secretKey = Q_Config::expect('Assets', 'payments', 'stripe', 'secret');
	\Stripe\Stripe::setApiKey($secretKey);

	$nonce = Q_Session::calculateNonce();
	$redirectUrl = Q_Uri::url("Assets/connected");

	$connectedAccount = new Assets_Connected();
	$connectedAccount->merchantUserId = Q::app();
	$connectedAccount->payments = 'stripe';

	if ($_GET['action'] == 'delete' && $_GET['accNo']) {
		$account = \Stripe\Account::retrieve($_GET['accNo']);
		$account->delete();
		exit;
	}

	if ($_GET['code'] && $_GET['state'] == $nonce) {
		$response = \Stripe\OAuth::token([
			'grant_type' => 'authorization_code',
			'code' => $_GET['code'],
		]);

		if ($response->error) {
			throw new Exception($response->error_description);
		}

		// Access the connected account id in the response
		$connectedAccount->accountId = $response->stripe_user_id;
		$connectedAccount->refreshToken = $response->refresh_token;
		if (!$connectedAccount->retrieve()) {
			$connectedAccount->save();
		}

		$dashboardLink = \Stripe\Account::createLoginLink($response->stripe_user_id);
		$redirectUrl = $dashboardLink->url;
		header("Location: ".$redirectUrl);
	} else {
		$connectedAccountId = null;
		if ($connectedAccount->retrieve()) {
			$connectedAccountId = $connectedAccount->accountId;
		}

		if ($connectedAccountId) {
			$dashboardLink = \Stripe\Account::createLoginLink($connectedAccountId);
			$redirectUrl = $dashboardLink->url;
		} else {
			$redirectUrl = Q::interpolate($stripeConnectLink, array(
				'redirect_uri' => Q_Uri::url("Assets/connected"),
				'client_id' => $stripeClientId,
				'state' => Q_Session::calculateNonce()
			));
		}
	}

	return @compact("redirectUrl");
}