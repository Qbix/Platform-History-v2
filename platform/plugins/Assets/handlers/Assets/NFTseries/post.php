<?php
function Assets_NFTseries_post ($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("publisherId", "streamName"), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$publisherId = Q::ifset($req, "publisherId", $loggedInUserId);
	$streamName = Q::ifset($req, "streamName", $loggedInUserId);
	$adminLabels = Q_Config::get("Users", "communities", "admins", null);
	// if user try to update align profile or is not an admin
	if ($publisherId != $loggedInUserId && !(bool)Users::roles(null, $adminLabels, array(), $loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	$stream = Streams::fetchOne(null, $publisherId, $streamName);

	if (Q_Request::slotName("selectNFTSeries")) {
		Assets_NFT::replaceAllRelationsWithOne((object)array(
			"publisherId" => $publisherId,
			"name" => Assets_NFT_Series::$categoryStreamName
		), Assets_NFT_Series::$selectedRelationType, $stream);
		return Q_Response::setSlot("selectNFTSeries", true);
	}

	$fields = Q::take($req, array("title", "attributes"));
	Assets_NFT_Series::update($stream, $fields);
}