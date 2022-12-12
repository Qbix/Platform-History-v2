<?php
/**
 * Get all tokens user owned in all chains (means chains registered in config)
 * @class HTTP Assets NFT owned
 * @method owned
 * @param {array} [$_REQUEST]
 *   @param {string} $_REQUEST.userId
 *   @param {string} $_REQUEST.offset
 *   @param {string} $_REQUEST.limit
 * @return {void}
 */
function Assets_NFT_response_owned ($params) {
	$request = array_merge($_REQUEST, $params);
	$sources = array();
	$platform = Q::ifset($request, 'platform', null);
	$appId = Q::ifset($request, 'appId', Q::app());
	list($appId, $appInfo) = Users::appInfo($platform, $appId);
	$chainId = Q::ifset($appInfo, 'appId', Q::ifset($appInfo, 'chainId', null));
	$ownerUserId = Q::ifset($request, "owner", "userId", null);
	$ownerXid = Q::ifset($request, "owner", "xid", null);
	if ($platform === 'web3' and !$ownerXid && $ownerUserId) {
		$ownerXid = Users_Web3::getWalletByUserId($ownerUserId);
	}
	$recipientXid = Q::ifset($request, "recipient", "xid", Users_Web3::getWalletByUserId());
	$pathABI = Q::ifset($request, "pathABI", "Assets/templates/R1/NFT/contract");
	$glob = array();
	$glob["offset"] = (int)Q::ifset($request, "offset", 0);
	$glob["limit"] = (int)Q::ifset($request, "limit", 1000);
	$countNFTs = 0;
	$glob["secondsInYear"] = 31104000;
	$tokensByOwnerLimit = Q_Config::get("Assets", "NFT", "methods", "tokensByOwner", "limit", 100);

	$chains = Assets_NFT::getChains();
	$chainId = Q::ifset($request, "chainId", null);
	$contractAddress = Q::ifset($request, "contractAddress", null);
	$glob["skipInfo"] = Q::ifset($request, "skipInfo", false);
	$glob["skipException"] = Q::ifset($request, "skipException", false);
	$glob["updateCache"] = filter_var(Q::ifset($request, "updateCache", false), FILTER_VALIDATE_BOOLEAN);
	if ($glob["updateCache"]) {
		$caching = null;
		$cacheDuration = 0;
	} else {
		$caching = true;
		$cacheDuration = null;
	}

	$tokenJSON = array();

	$_Assets_NFT_response_owned_json = function ($params, &$tokenJSON, &$countNFTs) use($glob) {
		$tokenId = $params["tokenId"];
		$chain = $params["chain"];
		$ABI = $params["ABI"];
		$untilTimestamp = Q::ifset($params, "untilTimestamp", null);
		$dataJson = compact("tokenId", "untilTimestamp");
		if ($glob["skipInfo"]) {
			$tokenJSON[] = $dataJson;
			return null;
		}

		try {
			$dataJson = array_merge($dataJson, Q::event("Assets/NFT/response/getInfo", array(
				"tokenId" => $tokenId,
				"chainId" => $chain["chainId"],
				"contractAddress" => $chain["contract"],
				"ABI" => $ABI,
				"updateCache" => $glob["updateCache"]
			)));
		} catch (Exception $e) {
			$tokenJSON[] = $dataJson;
			return null;
		}

		$countNFTs++;

		if ($countNFTs <= $glob["offset"]) {
			return null;
		} elseif ($countNFTs > $glob["offset"] + $glob["limit"]) {
			return false;
		}

		$tokenJSON[] = $dataJson;
		return null;
	};

	// get tokens by owner
	foreach ($chains as $chain) {
		if ($chainId) {
			if ($chainId != $chain["chainId"]) {
				continue;
			}

			if ($contractAddress) {
				$chain["contract"] = $contractAddress;
			}
		}

		if (empty($chain["contract"])) {
			continue;
		}

		$ABI = Users_Web3::getABI($pathABI);
		$tokensByOwner = Users_Web3::existsInABI("tokensByOwner", $ABI, "function", false);
		$balanceOf = Users_Web3::existsInABI("balanceOf", $ABI, "function", false);
		$getNftsByOwner = Users_Web3::existsInABI("getNftsByOwner", $ABI, "function", false);
		$tokenOfOwnerByIndex = Users_Web3::existsInABI("tokenOfOwnerByIndex", $ABI, "function", false);
		if ($tokensByOwner || $getNftsByOwner) {
			$methodName = "tokensByOwner";
			if ($getNftsByOwner) {
				$methodName = "getNftsByOwner";
			}

			$tokens = Users_Web3::execute($pathABI, $chain["contract"], $methodName, [$ownerXid, $tokensByOwnerLimit], $chain["chainId"], $caching, $cacheDuration);
			if (empty($tokens)) {
				continue;
			}
			if ($recipientXid and $platform === 'web3') {
				$dirtyTokens = $tokens;
				$tokens = array();
				$salesABI = 'Assets/templates/R1/NFT/sales/contract';
				foreach ($dirtyTokens as $tokenId) {
					$tokenInfo = Users_Web3::execute($salesABI, $ownerXid, "pending", [$tokenId], $chain["chainId"], $caching, 1000000);
					if ($recipientXid == $tokenInfo['recipient']) {
						$untilTimestamp = Q::ifset($tokenInfo, "untilTimestamp", null);
						$tokens[] = array(
							"tokenId" => $tokenId,
							"untilTimestamp" => $untilTimestamp
						);
					}
				}
			}

			foreach ($tokens as $tokenId) {
				$untilTimestamp = null;
				if (is_array($tokenId)) {
					$untilTimestamp = Q::ifset($tokenId, "untilTimestamp", null);
					$tokenId = Q::ifset($tokenId, "tokenId", null);
				}
				if ($_Assets_NFT_response_owned_json(compact("tokenId", "chain", "ABI", "untilTimestamp"), $tokenJSON, $countNFTs) === false) {
					break;
				}
			}
		} elseif ($balanceOf && $tokenOfOwnerByIndex) {
			$tokens = (int)Users_Web3::execute($source["pathABI"], $chain["contract"], "balanceOf", $source["address"], $chain["chainId"], $caching, $cacheDuration);
			for ($i = 0; $i < $tokens; $i++) {
				$tokenId = (int)Users_Web3::execute($source["pathABI"], $chain["contract"], "tokenOfOwnerByIndex", array($source["address"], $i), $chain["chainId"], $caching, $cacheDuration);
				if ($_Assets_NFT_response_owned_json(compact("tokenId", "chain", "ABI"), $tokenJSON, $countNFTs) === false) {
					break;
				}
			}
		} else {
			throw new Exception("Contract ".$chain["contract"]." doesn't support methods tokensByOwner and ".($balanceOf ? "tokenOfOwnerByIndex" : "balanceOf"));
		}
	}

	return $tokenJSON;
}