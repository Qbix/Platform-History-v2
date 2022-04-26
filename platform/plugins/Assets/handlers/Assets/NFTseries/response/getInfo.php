<?php
function Assets_NFTseries_response_getInfo ($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("chainId", "seriesId"), $req, true);
	$chainId = $req["chainId"];
	$seriesId = $req["seriesId"];

	$contractAddress = Assets_NFT::getChains($chainId)["contract"];

	$abiFileNames = array(
		implode(DS, [APP_WEB_DIR, "ABI", $contractAddress.".json"]),
		implode(DS, [APP_WEB_DIR, "ABI", "userNFTContractTemplate.json"])
	);
	$abiFileCorrect = false;
	foreach ($abiFileNames as $abiFileName) {
		if (is_file($abiFileName)) {
			$abiFileCorrect = true;
			break;
		}
	}
	if (!$abiFileCorrect) {
		throw new Exception("ABI file not found");
	}
	$abi = Q::json_decode(file_get_contents($abiFileName), true);
	$contractAddress = array($contractAddress, $abi);

	//$owner = Users_Web3::execute($contractAddress, "owner", array(), $chainId, false);
	$info = Users_Web3::execute($contractAddress, "seriesInfo", $seriesId, $chainId, false);

	return compact("info");
}