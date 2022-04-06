<?php
function Assets_NFTseries_response_newItem ($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("userId", "chainId", "category"), $req, true);
	$userId = Q::ifset($req, "userId", null);

	$categoryPublisherId = Q::ifset($req, "category", "publisherId", $userId);
	$category = Assets_NFT_Series::category($req["chainId"], $categoryPublisherId);
	$stream = Assets_NFT_Series::getComposerStream($req["chainId"], $category, $userId);
	$data = Q::event("Users/external/response/data", array("userId"));

	return array("publisherId" => $stream->publisherId, "streamName" => $stream->name, "wallet" => $data["wallet"]);
}