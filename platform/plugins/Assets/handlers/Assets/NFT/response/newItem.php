<?php
function Assets_NFT_response_newItem ($params) {
	$req = array_merge($_REQUEST, $params);
	$stream = Assets::getNFTStream(Q::ifset($req, "userId", null));
	return array("publisherId" => $stream->publisherId, "streamName" => $stream->name);
}