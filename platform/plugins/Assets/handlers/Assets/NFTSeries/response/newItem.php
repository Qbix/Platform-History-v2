<?php
function Assets_NFTSeries_response_newItem ($params) {
	$req = array_merge($_REQUEST, $params);
	$stream = Assets_NFT_Series::getComposerStream(Q::ifset($req, "userId", null));
	return array("publisherId" => $stream->publisherId, "streamName" => $stream->name);
}