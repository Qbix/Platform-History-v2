<?php
function Assets_NFTseries_response_newItem ($params) {
	$req = array_merge($_REQUEST, $params);
	$userId = Q::ifset($req, "userId", null);
	$stream = Assets_NFT_Series::getComposerStream($req["chainId"], $userId);
	$data = Q::event("Users/external/response/data", array("userId"));

	return array("publisherId" => $stream->publisherId, "streamName" => $stream->name, "wallet" => $data["wallet"]);
}