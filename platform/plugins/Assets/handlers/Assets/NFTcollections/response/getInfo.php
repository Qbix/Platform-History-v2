<?php
function Assets_NFTcollections_response_getInfo ($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("chainId", "collectionId"), $req, true);
	$chainId = $req["chainId"];
	$collectionId = $req["collectionId"];
	$pathABI = Q::ifset($request, 'pathABI', "Assets/templates/R1/NFT/contract");

	$contractAddress = Assets_NFT::getChains($chainId)["contract"];

	//$owner = Users_Web3::execute('Assets/NFT', $contractAddress, "owner", array(), $chainId, false);
	$info = Users_Web3::execute($pathABI, $contractAddress, "collectionInfo", $collectionId, $chainId, false);

	return compact("info");
}