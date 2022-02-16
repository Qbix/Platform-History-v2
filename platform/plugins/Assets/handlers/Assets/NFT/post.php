<?php
function Assets_NFT_post ($params) {
	$req = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, "userId", $loggedInUserId);

	// update NFT attributes
	if (Q_Request::slotName("attrUpdate")) {
		$displayTypes = Q_Config::expect("Assets", "Web3", "NFT", "attributes", "display_type");
		if (!in_array($req["display_type"], $displayTypes)) {
			return;
		}
		$attribute = new Assets_NftAttributes();
		$attribute->display_type = $req["display_type"];
		$attribute->trait_type = $req["trait_type"];
		$attribute->value = $req["value"];
		if (!$attribute->retrieve()) {
			$attribute->save();
		}

		Q_Response::setSlot('attrUpdate', true);
		return;
	}

	$stream = Assets_NFT::stream($userId);
	$fields = Q::take($req, array('title', 'content', 'attributes', 'interests'));

	Assets_NFT::update($stream, $fields);
}