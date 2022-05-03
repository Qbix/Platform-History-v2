<?php
function Assets_NFT_response_newItem ($params) {
	$req = array_merge($_REQUEST, $params);
	$userId = Q::ifset($req, "userId", null);
	$stream = Assets_NFT::getComposerStream();
	return array("publisherId" => $stream->publisherId, "streamName" => $stream->name);
}