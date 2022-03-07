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
	} else {
		$caching = true;
		$cacheDuration = null;
	}
	$longDuration = 31104000;
	$contractAddress = Assets_NFT::getChains($chainId)["contract"];

	$author = Users_Web3::execute($contractAddress, "authorOf", $tokenId, $chainId, $caching, $longDuration);
	$user = Users_ExternalTo::select()->where(array(
		"xid" => $author
	))->fetchDbRow();
	$userId = Q::ifset($user, "userId", null);

	$cachedOwnerOf = Users_Web3::getCache($chainId, $contractAddress, "ownerOf", $tokenId, $longDuration);
	$owner = Users_Web3::execute($contractAddress, "ownerOf", $tokenId, $chainId, $caching, $cacheDuration);
	// if owner changed, remove the cache rows related to ownership to update them on new request
	if ($cachedOwnerOf->wasRetrieved() && $owner != Q::json_decode($cachedOwnerOf->result)) {
		$cachedOwnerOf = Q::json_decode($cachedOwnerOf->result);
		$tokensByOwnerLimit = Q_Config::get("Assets", "NFT", "methods", "tokensByOwner", "limit", 100);
		Users_Web3::getCache($chainId, $contractAddress, "tokensByOwner", array($cachedOwnerOf, $tokensByOwnerLimit), $longDuration)->remove();
		Users_Web3::getCache($chainId, $contractAddress, "tokensByOwner", array($owner, $tokensByOwnerLimit), $longDuration)->remove();

		$balanceOfOldOwnerRow = Users_Web3::getCache($chainId, $contractAddress, "balanceOf", $cachedOwnerOf, $longDuration);
		if ($balanceOfOldOwnerRow->wasRetrieved()) {
			$balanceOfOldOwner = (int)Q::json_decode($balanceOfOldOwnerRow->result);
			$balanceOfOldOwnerRow->remove();
			for ($i = 0; $i < $balanceOfOldOwner; $i++) {
				Users_Web3::getCache($chainId, $contractAddress, "tokenOfOwnerByIndex", array($cachedOwnerOf, $i), $longDuration)->remove();
			}
		}

		$balanceOfNewOwnerRow = Users_Web3::getCache($chainId, $contractAddress, "balanceOf", $owner, $longDuration);
		if ($balanceOfNewOwnerRow->wasRetrieved()) {
			$balanceOfNewOwner = (int)Q::json_decode($balanceOfNewOwnerRow->result);
			$balanceOfNewOwnerRow->remove();
			for ($i = 0; $i < $balanceOfNewOwner; $i++) {
				Users_Web3::getCache($chainId, $contractAddress, "tokenOfOwnerByIndex", array($owner, $i), $longDuration)->remove();
			}
		}
	}

	$saleInfo = Users_Web3::execute($contractAddress, "saleInfo", $tokenId, $chainId, $caching, $cacheDuration);

	$commissionInfo = Users_Web3::execute($contractAddress, "getCommission", $tokenId, $chainId, $caching, $longDuration);

	$tokenURI = Users_Web3::execute($contractAddress, "tokenURI", $tokenId, $chainId, $caching, $longDuration);
	$data = Q::event('Assets/NFT/response/getRemoteJSON', compact("chainId", "contractAddress", "tokenURI"));

	return compact("author", "owner", "saleInfo", "commissionInfo", "data", "userId", "url");
}