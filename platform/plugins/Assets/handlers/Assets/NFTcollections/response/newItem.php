<?php
function Assets_NFTcollections_response_newItem ($params) {
	$req = array_merge($_REQUEST, $params);
	$stream = Assets_NFT_Collections::getComposerStream();
	return array("publisherId" => $stream->publisherId, "streamName" => $stream->name);
}