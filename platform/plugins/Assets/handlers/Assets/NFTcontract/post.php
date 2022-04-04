<?php
function Assets_NFTcontract_post ($params) {
	$req = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, "userId", $loggedInUserId);
	$adminLabels = Q_Config::get("Assets", "canCheckPaid", null);
	// if user try to update align profile or is not an admin
	if ($userId != $loggedInUserId && !(bool)Users::roles(null, $adminLabels, array(), $loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	$texts = Q_Text::get('Assets/content')['NFT']['contract'];
	$chain = Assets_NFT::getChains($req["chainId"]);
	$categoryStreamName = "Assets/NFT/contracts";
	$relationType = "Assets/NFT/contract";

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

		$category = Streams::fetchOne(null, $userId, $categoryStreamName);
		if (!$category) {
			throw new Exception("Stream $userId : $categoryStreamName not found");
		}

		$relatedStreams = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $category->publisherId,
			"toStreamName" => $category->name,
			"type" => $relationType
		))->fetchDbRows();
		foreach ($relatedStreams as $relation) {
			Streams::unrelate(null, $relation->toPublisherId, $relation->toStreamName, $relation->type, $relation->fromPublisherId, $relation->fromStreamName, array(
				"skipAccess" => true,
				"skipMessageTo" => true,
				"skipMessageFrom" => true
			));
		}
		Streams::relate(null, $category->publisherId, $category->name, $relationType, $stream->publisherId, $stream->name, array(
			"skipAccess" => true,
			"skipMessageTo" => true,
			"skipMessageFrom" => true,
			"ignoreCache" => true
		));

		Q_Response::setSlot("setContract", array(
			"publisherId" => $stream->publisherId,
			"streamName" => $stream->name
		));
		return;
	}

	Q_Valid::requireFields(array("userId", "chainId", "address", "symbol"), $req, true);

	$stream = Streams::fetchOne(null, $userId, $streamName);
	if (!$stream) {
		$stream = Streams::create(null, $userId, "Streams/category", array(
			"title" => Q::interpolate($texts["CustomContractFor"], array("chainNetwork" => $chain["name"])),
			"name" => $streamName,
			"readLevel" => 40,
			"writeLevel" => 10,
			"adminLevel" => 20
		), array(
			"publisherId" => $userId,
			"streamName" => $categoryStreamName,
			"type" => $relationType
		));
	}
	$stream->setAttribute("factory", $chain["factory"]);
	$stream->setAttribute("address", $req["address"]);
	$stream->setAttribute("symbol", $req["symbol"]);
	$stream->changed();
	Q_Response::setSlot("stream", array(
		"publisherId" => $stream->publisherId,
		"streamName" => $stream->name
	));
}