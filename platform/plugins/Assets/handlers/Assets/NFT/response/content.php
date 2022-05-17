<?php
function Assets_NFT_response_content ($params) {
	$request = array_merge($_REQUEST, $params);
	$uri = Q_Dispatcher::uri();
	$publisherId = Q::ifset($request, 'publisherId', Q::ifset($uri, 'publisherId', null));
	$streamId = Q::ifset($request, 'streamId', Q::ifset($uri, 'streamId', null));

	if (empty($publisherId)) {
		throw new Exception("NFT::view publisherId required!");
	}
	if (empty($streamId)) {
		throw new Exception("NFT::view streamId required!");
	}

	$streamName = "Assets/NFT/".$streamId;
	$params['stream'] = Streams::fetchOne(null, $publisherId, $streamName, true);

	$series = Streams::related(null, $publisherId, $streamName, false, array(
		"type" => Assets_NFT::$relationType,
		"streamsOnly" => true,
		"prefix" => "Assets/NFT/series/"
	));
	if ($series) {
		$lastPart = explode("/", reset($series)->name);
		$lastPart = end($lastPart);
		$params["selectedSeriesId"] = $lastPart;
	}
	Q::event('Assets/NFTprofile/response/column', $params);

	Q::event('Assets/NFT/response/column', $params);

	return Q::view('Assets/content/columns.php');
}