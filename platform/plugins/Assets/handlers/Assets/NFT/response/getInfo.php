<?php
function Assets_NFT_response_getInfo ($params) {
	$request = array_merge($_REQUEST, $params);
	$tokenId = $request["tokenId"];
	$network = $request["network"];
	$updateCache = (bool)$request["updateCache"];

	$author = Users_Web3::authorOf($tokenId, $network, $updateCache);
	$owner = Users_Web3::ownerOf($tokenId, $network, $updateCache);
	$saleInfo = Users_Web3::saleInfo($tokenId, $network, $updateCache);
	$commissionInfo = Users_Web3::getCommission($tokenId, $network, $updateCache);

	return compact("author", "owner", "saleInfo", "commissionInfo");
}