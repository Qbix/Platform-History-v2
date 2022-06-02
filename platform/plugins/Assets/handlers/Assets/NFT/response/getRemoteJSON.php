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
		$dataJson = Assets_NFT::getJson($chainId, $contractAddress, $tokenURI);
	} else {
		$dataJson = Q_Utils::get($tokenURI, null, array(
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_SSL_VERIFYHOST => false
		));
	}

	return $dataJson;
}