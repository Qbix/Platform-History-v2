<?php
function Assets_NFT_response_getInfo ($params) {
	$request = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('tokenId'), $request, true);

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
	$chain = $chainId ? Assets_NFT::getChains($chainId) : Assets_NFT::getDefaultChain();
	$contractAddress = Q::ifset($request, "contractAddress", $chain["contract"]);
	$tokenURI = Q::ifset($request, "tokenURI", null);
	$pathABI = Q::ifset($request, 'pathABI', "Assets/templates/R1/NFT/contract");

	$ABI = Q::ifset($request, "ABI", Users_Web3::getABI($pathABI));

	// execute authorOf if exists
	if (Users_Web3::existsInABI("authorOf", $ABI, "function", false)) {
		$author = Users_Web3::execute($pathABI, $contractAddress, "authorOf", $tokenId, $chainId, $caching, $longDuration);
		$authorUserId = Users_Web3::getUserIdByWallet($author);
	}

	// execute ownerOf if exists
	if (Users_Web3::existsInABI("ownerOf", $ABI, "function", false)) {
		$cachedOwnerOf = Users_Web3::getCache($chainId, $contractAddress, "ownerOf", $tokenId, $longDuration);
		$owner = Users_Web3::execute($pathABI, $contractAddress, "ownerOf", $tokenId, $chainId, $caching, $cacheDuration);
		$ownerUserId = Users_Web3::getUserIdByWallet($owner);
		// if owner changed, remove the cache rows related to ownership to update them on new request
		if ($cachedOwnerOf->wasRetrieved() && $owner != Q::json_decode($cachedOwnerOf->result)) {
			$cachedOwnerOf = Q::json_decode($cachedOwnerOf->result);
			Assets_NFT::clearContractCache($chainId, $contractAddress, array($cachedOwnerOf, $owner));
		}
	}

	// execute saleInfo if exists
	if (Users_Web3::existsInABI("saleInfo", $ABI, "function", false)) {
		$saleInfo = Users_Web3::execute($pathABI, $contractAddress, "saleInfo", $tokenId, $chainId, $caching, $cacheDuration);
	}

	// execute getCommission if exists
	if (Users_Web3::existsInABI("getCommission", $ABI, "function", false)) {
		$commissionInfo = Users_Web3::execute($pathABI, $contractAddress, "getCommission", $tokenId, $chainId, $caching, $longDuration);
	}

	if (!$tokenURI && Users_Web3::existsInABI("tokenURI", $ABI, "function", false)) {
		$tokenURI = Users_Web3::execute($pathABI, $contractAddress, "tokenURI", $tokenId, $chainId, true, $longDuration);
		$tokenURI = Q_Uri::interpolateUrl($tokenURI);
	}

	$metadata = null;
	try {
		$metadata = Q::event('Assets/NFT/response/fetchMetadata', compact("tokenId","chainId", "contractAddress", "ABI", "tokenURI", "pathABI"));
	} catch (Exception $e) {}

	return compact("tokenId", "chainId", "author", "owner", "saleInfo", "commissionInfo", "metadata", "authorUserId", "ownerUserId", "tokenURI");
}