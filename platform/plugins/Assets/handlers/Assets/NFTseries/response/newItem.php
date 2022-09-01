<?php
function Assets_NFTseries_response_newItem ($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("userId"), $req, true);
	$userId = Q::ifset($req, "userId", null);
	$stream = Assets_NFT_Series::getComposerStream($userId);
	return array("publisherId" => $stream->publisherId, "streamName" => $stream->name);
}