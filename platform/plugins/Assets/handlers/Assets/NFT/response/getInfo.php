<?php
function Assets_NFT_response_getInfo ($params) {
	$request = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('tokenId', 'chainId'), $request, true);

	$tokenId = $request["tokenId"];
	$chainId = $request["chainId"];
	$updateCache = Q::ifset($request, 'updateCache', false);
	if ($updateCache) {
		$caching = null;
		$cacheDuration = 0;
		$longDuration = 0;
	} else {
		$caching = true;
		$cacheDuration = null;
		$longDuration = 31104000;
	}
	$contractAddress = Assets_NFT::getChains($chainId)["contract"];

	$author = Users_Web3::execute($contractAddress, "authorOf", $tokenId, $chainId, $caching, $longDuration);
	$user = Users_ExternalTo::select()->where(array(
		"xid" => $author
	))->fetchDbRow();
	$userId = Q::ifset($user, "userId", null);

	$owner = Users_Web3::execute($contractAddress, "ownerOf", $tokenId, $chainId, $caching, $cacheDuration);

	$saleInfo = Users_Web3::execute($contractAddress, "saleInfo", $tokenId, $chainId, $caching, $cacheDuration);

	$commissionInfo = Users_Web3::execute($contractAddress, "getCommission", $tokenId, $chainId, $caching, $longDuration);

	$tokenURI = Users_Web3::execute($contractAddress, "tokenURI", $tokenId, $chainId, $caching, $longDuration);
	$data = Q::event('Assets/NFT/response/getRemoteJSON', compact("chainId", "contractAddress", "tokenURI"));

	return compact("author", "owner", "saleInfo", "commissionInfo", "data", "userId", "url");
}