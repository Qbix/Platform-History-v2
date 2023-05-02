<?php
function Assets_NFTcollections_post ($params) {
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

	$stream = Streams_Stream::fetch(null, $publisherId, $streamName);

	$fields = Q::take($req, array("title", "content", "attributes"));
	Assets_NFT_Collections::update($stream, $fields);
}