<?php
function Assets_NFT_response_fetchMetadata ($params) {
	Q_Valid::nonce(true);

	$request = array_merge($_REQUEST, $params);
	$tokenId = Q::ifset($request, "tokenId", null);
	$chainId = Q::ifset($request, "chainId", null);
	$contractAddress = Q::ifset($request, "contractAddress", null);
	$tokenURI = Q::ifset($request, "tokenURI", null);
	$ABI = Q::ifset($request, "ABI", null);
	$pathABI = Q::ifset($request, 'pathABI', Users_Web3::getDefaultABIpath("contract"));
	$throwException = Q::ifset($request, 'throwException', false);
	$longDuration = 31104000;

	if (!filter_var($tokenURI, FILTER_VALIDATE_URL)) {
		if ($tokenId && $chainId && $contractAddress) {
			$ABI = Q::ifset($ABI, Users_Web3::getABI($pathABI));

			// execute tokenURI if exists
			if (Users_Web3::existsInABI("tokenURI", $ABI, "function", false)) {
				$tokenURI = Users_Web3::execute($pathABI, $contractAddress, "tokenURI", $tokenId, $chainId, true, $longDuration);
			} else {
				if ($throwException) {
					throw new Exception("not found tokenURI method in ABI of contract \"".$contractAddress."\"");
				} else {
					$tokenURI = "{{baseUrl}}/Q/plugins/Assets/NFT/dummy.json";
				}
			}

			if (!filter_var($tokenURI, FILTER_VALIDATE_URL)) {
				if ($throwException) {
					throw new Exception("invalid tokenURI \"".$contractAddress."\" for contract \"".$contractAddress."\"");
				} else {
					$tokenURI = "{{baseUrl}}/Q/plugins/Assets/NFT/dummy.json";
				}
			}
		} else {
			if ($throwException) {
				throw new Exception("Required params omitted");
			} else {
				$tokenURI = "{{baseUrl}}/Q/plugins/Assets/NFT/dummy.json";
			}
		}
	}

	$tokenURI = Q_Uri::interpolateUrl($tokenURI);
	$dataJson = Assets_NFT::fetchMetadata($tokenURI);
	if (is_string($dataJson)) {
		$dataJson = Q::json_decode($dataJson);
	}

	return $dataJson;
}