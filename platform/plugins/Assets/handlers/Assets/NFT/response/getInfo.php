<?php
function Assets_NFT_response_getInfo ($params) {
	$request = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('tokenId', 'chainId'), $request, true);

	$tokenId = $request["tokenId"];
	$chainId = $request["chainId"];
	$caching = !Q::ifset($request, 'updateCache', false);
	$contractAddress = Assets_NFT_Web3::getChains($chainId)["contract"];

	$author = Users_Web3::execute($contractAddress, "authorOf", $tokenId, $chainId, $caching);
	$user = Users_ExternalTo::select()->where(array(
		"xid" => $author
	))->fetchDbRow();
	$userId = Q::ifset($user, "userId", null);

	$owner = Users_Web3::execute($contractAddress, "ownerOf", $tokenId, $chainId, $caching);

	$saleInfo = Users_Web3::execute($contractAddress, "saleInfo", $tokenId, $chainId, $caching);

	$commissionInfo = Users_Web3::execute($contractAddress, "getCommission", $tokenId, $chainId, $caching);

	$url = Users_Web3::execute($contractAddress, "tokenURI", $tokenId, $chainId, $caching);
	$data = Q::event('Assets/NFT/response/getRemoteJSON', compact("url"));

	return compact("author", "owner", "saleInfo", "commissionInfo", "data", "userId");
}