<?php
function Assets_NFTcontract_post ($params) {
	$req = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, "userId", $loggedInUserId);
	$adminLabels = Q_Config::get("Users", "communities", "admins", null);
	// if user try to update align profile or is not an admin
	if ($userId != $loggedInUserId && !(bool)Users::roles(null, $adminLabels, array(), $loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	$texts = Q_Text::get('Assets/content')['NFT']['contract'];
	$chain = Assets_NFT::getChains($req["chainId"]);
	$categoryStreamName = "Assets/NFT/contracts";
	$relationType = "Assets/NFT/contract";

	$category = Streams::fetchOne(null, $userId, $categoryStreamName);
	if (!$category) {
		throw new Exception("Stream $userId : $categoryStreamName not found");
	}

	$streamName = Q::interpolate(Assets_NFT_Series::$categoryStreamName, array("chainId" => $req["chainId"]));

	Q_Valid::requireFields(array("userId", "chainId"), $req, true);

	if (Q_Request::slotName("setContract")) {
		$publisherId = Q::ifset($req, "publisherId", null);
		if (!$publisherId) {
			throw new Exception("publisher id not found");
		}

		$stream = Streams::fetchOne(null, $publisherId, $streamName);
		if (!$stream) {
			throw new Exception("Stream $publisherId : $streamName not found");
		}

		Assets_NFT::replaceAllRelationsWithOne($category, $relationType, $stream);

		Q_Response::setSlot("setContract", array(
			"publisherId" => $stream->publisherId,
			"streamName" => $stream->name
		));
		return;
	}

	Q_Valid::requireFields(array("userId", "chainId", "contract", "symbol"), $req, true);

	$stream = Streams::fetchOne(null, $userId, $streamName);
	if (!$stream) {
		$stream = Streams::create(null, $userId, "Assets/NFT/contract", array(
			"title" => Q::interpolate($texts["CustomContractFor"], array("chainNetwork" => $chain["name"])),
			"name" => $streamName
		));
	}
	$stream->setAttribute("factory", $chain["factory"]);
	$stream->setAttribute("contract", $req["contract"]);
	$stream->setAttribute("symbol", $req["symbol"]);
	$stream->changed();

	Assets_NFT::replaceAllRelationsWithOne($category, $relationType, $stream);

	Q_Response::setSlot("stream", array(
		"publisherId" => $stream->publisherId,
		"streamName" => $stream->name
	));
}