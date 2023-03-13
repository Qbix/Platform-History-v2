<?php
function Assets_balances_response_balance($params) {
	Q_Valid::nonce(true);

	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("userId", "chainId"), $req, true);
	$chainId = $req["chainId"];
	$tokenAddresses = $req["tokenAddresses"];
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

	return Assets_Currency_Web3::balances($chainId, $walletAddress, $tokenAddresses);
}