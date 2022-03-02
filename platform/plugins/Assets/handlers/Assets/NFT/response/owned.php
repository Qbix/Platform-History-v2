<?php
function Assets_NFT_response_owned ($params) {
	$loggedInUser = Users::loggedInUser();
	$request = array_merge($_REQUEST, $params);
	$userId = Q::ifset($request, 'userId', $loggedInUser->id);

	$chains = Assets_NFT::getChains();
	$wallet = Users_Web3::getWalletById($userId, true);
	$tokenJSON = array();

	// get tokens by owner
	foreach ($chains as $chain) {
		$tokens = (int)Users_Web3::execute($chain["contract"], "balanceOf", $wallet, $chain["chainId"]);
		//$tokens = Users_Web3::execute($chain["contract"], "tokensByOwner", [$wallet, 100], $chain["chainId"]);
		for ($i = 0; $i < $tokens; $i++) {
		//foreach ($tokens as $token) {
			try {
				$tokenId = (int)Users_Web3::execute($chain["contract"], "tokenOfOwnerByIndex", array($wallet, $i), $chain["chainId"]);
				$tokenURI = Users_Web3::execute($chain["contract"], "tokenURI", $tokenId, $chain["chainId"]);

				// try to request token URI, if response if not valid json - continue
				$dataJson = Assets_NFT::getJson($chain["chainId"], $chain["contract"], $tokenURI);
			} catch (Exception $e) {
				continue;
			}

			$tokenJSON[] = array(
				"tokenId" => $tokenId,
				"chainId" => $chain["chainId"],
				"data" => $dataJson
			);
		}
	}

	return $tokenJSON;
}