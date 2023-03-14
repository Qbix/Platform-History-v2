<?php
require_once Q_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

function Assets_currencies_response_cryptoBalance($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("userId", "chainId"), $req, true);
	$chainId = $req["chainId"];
	$tokenAddress = $req["tokenAddress"];
	$user = Users::fetch($req["userId"], true);
	$loggedInUser = Users::loggedInUser(true);

	// check access to Streams/user/xid/web3 stream
	$stream = Streams::fetchOne(null, $user->id, "Streams/user/xid/web3");
	if (!$stream || !$stream->testReadLevel("content")) {
		throw new Exception("This user denied access to his wallet");
	}

	$walletAddress = $loggedInUser->getXid("web3_all");
	if (empty($walletAddress)) {
		throw new Exception("You have no wallet registered");
	}

	$apiKey = Q_Config::expect("Assets", "moralis", "apiKey");
	$apiEndPoint = Q::interpolate(Q_Config::expect("Assets", "moralis", "balanceEndPoint"), compact("walletAddress", "chainId"));
	if ($tokenAddress) {
		$apiEndPoint .= '&token_addresses='.$tokenAddress;
	}
	$client = new \GuzzleHttp\Client();
	$response = $client->request('GET', $apiEndPoint, array(
		'headers' => array (
			'Accept' => 'application/json',
			'X-API-Key' => $apiKey
		)
	));

	$res = $response->getBody()->getContents();

	if (empty($res)) {
		throw new Exception("You have no tokens");
	}

	return json_decode($res);
}