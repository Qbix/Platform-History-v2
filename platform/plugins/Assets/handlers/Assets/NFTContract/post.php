<?php
function Assets_NFTContract_post ($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("userId", "chainId", "address", "symbol"), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, "userId", $loggedInUserId);
	$adminLabels = Q_Config::get("Assets", "canCheckPaid", null);
	// if user try to update align profile or is not an admin
	if ($userId != $loggedInUserId && !(bool)Users::roles(null, $adminLabels, array(), $loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	$texts = Q_Text::get('Assets/content')['NFT']['contract'];

	$streamName = Q::interpolate(Assets_NFT_Series::$categoryStreamName, array("chainId" => $req["chainId"]));
	$stream = Streams::fetchOne(null, $userId, $streamName);
	if (!$stream) {
		$stream = Streams::create(null, $userId, "Streams/category", array(
			"title" => Q::interpolate($texts["ContractFor"], array("chain" => Assets_NFT::getChains($req["chainId"])["name"])),
			"name" => $streamName,
			"readLevel" => 40,
			"writeLevel" => 10,
			"adminLevel" => 20
		));
	}
	$stream->setAttribute("address", $req["address"]);
	$stream->setAttribute("symbol", $req["symbol"]);
	$stream->changed();
	Q_Response::setSlot("stream", array(
		"publisherId" => $stream->publisherId,
		"streamName" => $stream->name
	));
}