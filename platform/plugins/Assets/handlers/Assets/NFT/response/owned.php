<?php
function Assets_NFT_response_owned ($params) {
	$loggedInUser = Users::loggedInUser();
	$request = array_merge($_REQUEST, $params);
	$userId = Q::ifset($request, 'userId', $loggedInUser->id);
	$offset = (int)Q::ifset($request, 'offset', 0);
	$limit = (int)Q::ifset($request, 'limit', 1000);
	$countNFTs = 0;
	$GLOBALS["secondsInYear"] = 31104000;

	$chains = Assets_NFT::getChains();
	$wallet = Users_Web3::getWalletById($userId, true);
	$tokenJSON = array();

	function _Assets_NFT_response_owned_json ($tokenId, $chain, &$tokenJSON) {
		try {
			$tokenURI = Users_Web3::execute($chain["contract"], "tokenURI", $tokenId, $chain["chainId"], true, $GLOBALS["secondsInYear"]);

			// try to request token URI, if response if not valid json - continue
			$dataJson = Assets_NFT::getJson($chain["chainId"], $chain["contract"], $tokenURI);
		} catch (Exception $e) {
			return false;
		}

		$tokenJSON[] = array(
			"tokenId" => $tokenId,
			"chainId" => $chain["chainId"],
			"data" => $dataJson
		);
	}

	// get tokens by owner
	foreach ($chains as $chain) {
		if (Users_Web3::existsInABI("tokensByOwner", $chain["contract"], "function")) {
			try {
				$tokens = Users_Web3::execute($chain["contract"], "tokensByOwner", [$wallet, 100], $chain["chainId"]);
			} catch (Exception $e) {
				continue;
			}

			if (empty($tokens)) {
				continue;
			}

			foreach ($tokens as $tokenId) {
				if ($countNFTs < $offset) {
					$countNFTs++;
					continue;
				}

				_Assets_NFT_response_owned_json($tokenId, $chain, $tokenJSON);
				$countNFTs++;
				if ($countNFTs > $offset + $limit) {
					break;
				}
			}
		} else {
			$tokens = (int)Users_Web3::execute($chain["contract"], "balanceOf", $wallet, $chain["chainId"]);
			for ($i = 0; $i < $tokens; $i++) {
				if ($countNFTs < $offset) {
					$countNFTs++;
					continue;
				}

				$tokenId = (int)Users_Web3::execute($chain["contract"], "tokenOfOwnerByIndex", array($wallet, $i), $chain["chainId"], true, $GLOBALS["secondsInYear"]);
				_Assets_NFT_response_owned_json($tokenId, $chain, $tokenJSON);
				$countNFTs++;
				if ($countNFTs > $offset + $limit) {
					break;
				}
			}
		}
	}

	return $tokenJSON;
}