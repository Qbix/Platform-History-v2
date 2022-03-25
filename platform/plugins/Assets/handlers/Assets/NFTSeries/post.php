<?php
function Assets_NFTSeries_post ($params) {
	$req = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, "userId", $loggedInUserId);
	$adminLabels = Q_Config::get("Assets", "canCheckPaid", null);
	// if user try to update align profile or is not an admin
	if ($userId != $loggedInUserId && !(bool)Users::roles(null, $adminLabels, array(), $loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	if (Q_Request::slotName("contractStream")) {
		$stream = Streams::fetchOne(null, $userId, Assets_NFT_Series::$categoryStreamName);
		if (!$stream) {
			$stream = Streams::create(null, $userId, "Streams/category", array(
				"name" => Assets_NFT_Series::$categoryStreamName,
				"readLevel" => 40,
				"writeLevel" => 10,
				"adminLevel" => 20
			));
		}
		$stream->setAttribute("address", $req["address"]);
		$stream->setAttribute("symbol", $req["symbol"]);
		$stream->changed();
		Q_Response::setSlot("contractStream", array(
			"publisherId" => $stream->publisherId,
			"streamName" => $stream->name
		));
		return;
	}

	$stream = Assets_NFT_Series::getComposerStream($userId);
	$fields = Q::take($req, array("title", "content", "attributes"));
	Assets_NFT_Series::update($stream, $fields);
}