<?php
function Assets_NFTseries_post ($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("userId", "chainId", "category"), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, "userId", $loggedInUserId);
	$adminLabels = Q_Config::get("Users", "communities", "admins", null);
	// if user try to update align profile or is not an admin
	if ($userId != $loggedInUserId && !(bool)Users::roles(null, $adminLabels, array(), $loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	$categoryPublisherId = Q::ifset($req, "category", "publisherId", $userId);
	$category = Assets_NFT_Series::category($req["chainId"], $categoryPublisherId);
	$stream = Assets_NFT_Series::getComposerStream($req["chainId"], $category, $userId);
	$fields = Q::take($req, array("attributes"));
	Assets_NFT_Series::update($stream, $fields, $category);
}