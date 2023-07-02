<?php
function Assets_balances_response_balance($params) {
	Q_Valid::nonce(true);

	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("walletAddress", "chainId"), $req, true);
	$walletAddress = $req["walletAddress"];
	$chainId = $req["chainId"];
	$tokenAddresses = $req["tokenAddresses"];

	return Assets_Currency_Web3::balances($chainId, $walletAddress, $tokenAddresses);
}