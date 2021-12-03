<?php
function Assets_NFT_response_getInfo ($params) {
	Q_Request::requireFields(array('appId', 'contractAddress', 'tokenId'), true);

	$request = array_merge($_REQUEST, $params);
	$appId = $request["appId"];
	$contractAddress = $request['contractAddress'];
	$tokenId = $request["tokenId"];
	$caching = Q::ifset($request, 'caching', true);

	$author = Users_Web3::execute($contractAddress, "authorOf", $tokenId, $caching, null, $appId);
	$owner = Users_Web3::execute($contractAddress, "ownerOf", $tokenId, $caching, null, $appId);
	$saleInfo = Users_Web3::execute($contractAddress, "saleInfo", $tokenId, $caching, null, $appId);
	$commissionInfo = Users_Web3::execute($contractAddress, "getCommission", $tokenId, $caching, null, $appId);

	return compact("author", "owner", "saleInfo", "commissionInfo");
}