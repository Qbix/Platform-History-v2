<?php
function Assets_NFT_response_getRemoteJSON ($params) {
	Q_Valid::nonce(true);

	$request = array_merge($_REQUEST, $params);
	$required = array('tokenURI');
	Q_Valid::requireFields($required, $request, true);
	$chainId = Q::ifset($request, "chainId", null);
	$contractAddress = Q::ifset($request, "contractAddress", null);
	$tokenURI = $request["tokenURI"];

	if ($chainId && $contractAddress) {
		$dataJson = Assets_NFT::metadata($chainId, $contractAddress, $tokenURI);
	} else {
		$dataJson = Assets_NFT::fetchMetadata($tokenURI);
	}

	return $dataJson;
}