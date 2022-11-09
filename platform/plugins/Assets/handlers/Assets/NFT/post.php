<?php
function Assets_NFT_post ($params) {
	$request = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(["publisherId", "streamName"], $request, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$publisherId = Q::ifset($request, "publisherId", null);
	$streamName = Q::ifset($request, "streamName", null);
	$category = Q::ifset($request, "category", null);
	$adminLabels = Q_Config::get("Users", "communities", "admins", null);
	// if user try to update align profile or is not an admin
	if ($publisherId != $loggedInUserId && !(bool)Users::roles(null, $adminLabels, array(), $loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	//$stream = Assets_NFT::getComposerStream($publisherId);
	$stream = Streams_Stream::fetch(null, $publisherId, $streamName);
	$fields = Q::take($request, array("title", "content", "attributes"));
	Assets_NFT::updateNFT($stream, $fields, $category);

	/*$tokenId = $fields["attributes"]["tokenId"];
	if ($tokenId) {
		$chainId = $fields["attributes"]["chainId"];
		$chain = Assets_NFT::getChains($chainId);
		$wallet = Users_Web3::getWalletByUserId($publisherId);

		Assets_NFT::clearContractCache($chainId, $chain["contract"], $wallet);
	}*/

	Q_Response::setSlot("NFTStream", array("publisherId" => $stream->publisherId, "streamName" => $stream->name));
}