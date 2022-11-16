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
	$loggedInUser = Users::loggedInUser();
	$request = array_merge($_REQUEST, $params);
	$userId = Q::ifset($request, 'userId', $loggedInUser->id);
	$glob = array();
	$glob["offset"] = (int)Q::ifset($request, 'offset', 0);
	$glob["limit"] = (int)Q::ifset($request, 'limit', 1000);
	$countNFTs = 0;
	$glob["secondsInYear"] = 31104000;
	$tokensByOwnerLimit = Q_Config::get("Assets", "NFT", "methods", "tokensByOwner", "limit", 100);

	$chains = Assets_NFT::getChains();
	$accountAddress = Q::ifset($request, 'accountAddress', Users_Web3::getWalletByUserId($userId));
	$chainId = Q::ifset($request, 'chainId', null);
	$contractAddress = Q::ifset($request, 'contractAddress', null);
	$pathABI = Q::ifset($request, 'pathABI', "Assets/templates/R1/NFT/contract");
	$glob["skipInfo"] = Q::ifset($request, 'skipInfo', false);

	$tokenJSON = array();

	$_Assets_NFT_response_owned_json = function ($tokenId, $chain, $ABI, &$tokenJSON, &$countNFTs) use($glob) {
		if ($glob["skipInfo"]) {
			$tokenJSON[] = compact("tokenId");
			return null;
		}

		try {
			$dataJson = Q::event('Assets/NFT/response/getInfo', array(
				"tokenId" => $tokenId,
				"chainId" => $chain["chainId"],
				"contractAddress" => $chain["contract"],
				"ABI" => $ABI
			));
		} catch (Exception $e) {
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

			$tokens = Users_Web3::execute($pathABI, $chain["contract"], $methodName, [$accountAddress, $tokensByOwnerLimit], $chain["chainId"]);
			if (empty($tokens)) {
				continue;
			}

			foreach ($tokens as $tokenId) {
				if ($_Assets_NFT_response_owned_json($tokenId, $chain, $ABI, $tokenJSON, $countNFTs) === false) {
					break;
				}
			}
		} elseif ($balanceOf && $tokenOfOwnerByIndex) {
			$tokens = (int)Users_Web3::execute($pathABI, $chain["contract"], "balanceOf", $accountAddress, $chain["chainId"]);
			for ($i = 0; $i < $tokens; $i++) {
				$tokenId = (int)Users_Web3::execute($pathABI, $chain["contract"], "tokenOfOwnerByIndex", array($accountAddress, $i), $chain["chainId"], true, $glob["secondsInYear"]);
				if ($_Assets_NFT_response_owned_json($tokenId, $chain, $ABI, $tokenJSON, $countNFTs) === false) {
					break;
				}
			}
		} else {
			throw new Exception("Contract ".$chain["contract"]." doesn't support methods tokensByOwner and ".($balanceOf ? "tokenOfOwnerByIndex" : "balanceOf"));
		}
	}

	return $tokenJSON;
}