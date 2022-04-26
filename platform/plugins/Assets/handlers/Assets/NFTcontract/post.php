<?php
function Assets_NFTcontract_post ($params) {
	$req = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, "userId", $loggedInUserId);
	$adminLabels = Q_Config::get("Users", "communities", "admins", null);
	$allowAuthor = Q_Config::get("Assets", "NFT", "contract", "allow", "author", false);
	// if user try to update align profile or is not an admin
	if (!($allowAuthor && $userId == $loggedInUserId) && !(bool)Users::roles(null, $adminLabels, array(), $loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	$texts = Q_Text::get('Assets/content')['NFT']['contract'];
	$chain = Assets_NFT::getChains($req["chainId"]);
	$category = Assets_NFT_Contract::category($userId);

	Q_Valid::requireFields(array("userId", "chainId"), $req, true);

	if (Q_Request::slotName("setContract")) {
		$publisherId = Q::ifset($req, "publisherId", null);
		if (!$publisherId) {
			throw new Exception("publisher id not found");
		}

		$stream = Assets_NFT_Contract::getStream($req["chainId"], $publisherId, true);

		Assets_NFT::replaceAllRelationsWithOne($category, Assets_NFT_Contract::$relationType, $stream);

		Q_Response::setSlot("setContract", array(
			"publisherId" => $stream->publisherId,
			"streamName" => $stream->name
		));
		return;
	}

	Q_Valid::requireFields(array("userId", "chainId", "contract", "name", "symbol"), $req, true);

	$stream = Assets_NFT_Contract::getStream($req["chainId"], $userId);
	if (!$stream) {
		$stream = Streams::create(null, $userId, "Assets/NFT/contract", array(
			"title" => Q::interpolate($texts["CustomContractFor"], array(
				"contractName" => $req["name"],
				"contractSymbol" => $req["symbol"],
				"chainNetwork" => $chain["name"]
			)),
			"name" => Q::interpolate(Assets_NFT_Contract::$streamName, array("chainId" => $req["chainId"]))
		));
	}
	$stream->setAttribute("factory", $chain["factory"]);
	$stream->setAttribute("contract", $req["contract"]);
	$stream->setAttribute("name", $req["name"]);
	$stream->setAttribute("symbol", $req["symbol"]);
	$stream->changed();

	Assets_NFT::replaceAllRelationsWithOne($category, Assets_NFT_Contract::$relationType, $stream);

	Q_Response::setSlot("stream", array(
		"publisherId" => $stream->publisherId,
		"streamName" => $stream->name
	));
}