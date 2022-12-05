<?php
function Assets_currencies_response_cryptoBalance($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("userId"), $req, true);

	$user = Users::fetch($req["userId"], true);
	$loggedInUser = Users::loggedInUser(true);

	// check access to Streams/user/xid/web3 stream
	$stream = Streams::fetchOne(null, $user->id, "Streams/user/xid/web3");
	if (!$stream || !$stream->testReadLevel("content")) {
		throw new Exception("This user denied access to his wallet");
	}

	$address = $loggedInUser->getXid("web3_all");
	if (empty($address)) {
		throw new Exception("You have no wallet registered");
	}

	$address = "0x32Be343B94f860124dC4fEe278FDCBD38C102D88";
	$apiKey = Q_Config::expect("Assets", "ethplorer", "apiKey");
	$apiEndPoint = Q::interpolate(Q_Config::expect("Assets", "ethplorer", "endPoint"), compact("address", "apiKey"));

	$res = array();
	$data = Q::json_decode(Q_Utils::get($apiEndPoint), true);
	$eth = Q::ifset($data, "ETH", null);
	if ($eth && $eth["balance"]) {
		$res["ETH"] = array(
			"address" => "0x0000000000000000000000000000000000000000",
			"name" => "Ethereum",
			"symbol" => "ETH",
			"decimals" => 18,
			"balance" => $eth["balance"]
		);
	}
	$tokens = Q::ifset($data, "tokens", array());
	foreach ($tokens as $token) {
		$tokenInfo = Q::ifset($token, "tokenInfo", array());
		if (empty($token["balance"]) || empty($tokenInfo["symbol"])) {
			continue;
		}
		$res[$tokenInfo["symbol"]] = array(
			"address" => $tokenInfo["address"],
			"name" => $tokenInfo["name"],
			"symbol" => $tokenInfo["symbol"],
			"decimals" => $tokenInfo["decimals"],
			"balance" => $token["balance"]
		);
	}

	if (empty($res)) {
		throw new Exception("You have no tokens");
	}

	return $res;
}