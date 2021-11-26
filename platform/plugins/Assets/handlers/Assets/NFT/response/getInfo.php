<?php
function Assets_NFT_response_getInfo ($params) {
	$request = array_merge($_REQUEST, $params);
	$tokenId = $request["tokenId"];
	$chainId = $request["chainId"];
	$updateCache = (bool)$request["updateCache"];

	$author = Users_Web3::execute($chainId, "authorOf", $tokenId, $updateCache);
	$owner = Users_Web3::execute($chainId, "ownerOf", $tokenId, $updateCache);
	$saleInfo = Users_Web3::execute($chainId, "saleInfo", $tokenId, $updateCache);
	$commissionInfo = Users_Web3::execute($chainId, "getCommission", $tokenId, $updateCache);

	return compact("author", "owner", "saleInfo", "commissionInfo");
}