<?php
function Assets_NFTseries_response_getInfo ($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("chainId", "seriesId"), $req, true);
	$chainId = $req["chainId"];
	$seriesId = $req["seriesId"];

	$contractAddress = Assets_NFT::getChains($chainId)["contract"];

	//$owner = Users_Web3::execute('Assets/NFT', $contractAddress, "owner", array(), $chainId, false);
	$info = Users_Web3::execute('Assets/templates/NFT', $contractAddress, "seriesInfo", $seriesId, $chainId, false);

	return compact("info");
}