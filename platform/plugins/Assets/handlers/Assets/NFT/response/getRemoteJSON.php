<?php
function Assets_NFT_response_getRemoteJSON ($params) {
	Q_Valid::nonce(true);

	$request = array_merge($_REQUEST, $params);
	$required = array('chainId', 'contractAddress', 'tokenURI');
	Q_Valid::requireFields($required, $request, true);

	$dataJson = Assets_NFT::getJson($request["chainId"], $request["contractAddress"], $request["tokenURI"]);

	return $dataJson;
}