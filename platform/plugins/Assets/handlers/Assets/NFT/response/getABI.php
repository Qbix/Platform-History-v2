<?php
function Assets_NFT_response_getABI ($params) {
	Q_Valid::nonce(true);

	$request = array_merge($_REQUEST, $params);
	$chainId = Q::ifset($request, "chainId", null);
	$contractAddress = Q::ifset($request, "contractAddress", null);

	$ABI = Users_Web3::getABI($contractAddress, $chainId);

	return $ABI;
}