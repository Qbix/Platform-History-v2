<?php
function Assets_NFT_response_content ($params) {
	$uri = Q_Dispatcher::uri();
	$request = array_merge($_REQUEST, $params);
	$tokenId = Q::ifset($request, 'tokenId', Q::ifset($uri, 'tokenId', null));
	$chainId = Q::ifset($request, 'chainId', Q::ifset($uri, 'chainId', null));
	if (!$chainId) {
		$chain = Assets_NFT::getDefaultChain();
		if (!$chain) {
			throw new Exception("Default chain not found");
		}

		$chainId = $chain["chainId"];
	}

	$url = $_SERVER["REQUEST_SCHEME"]."://".$_SERVER["HTTP_HOST"].$_SERVER["REQUEST_URI"];
	$needle = ".json";
	$isJson = substr_compare($url, $needle, -strlen($needle)) === 0;
	if ($isJson) {
		$chainId = str_replace($needle, "", $chainId);
		$tokenId = str_replace($needle, "", $tokenId);
	}

	if ($tokenId === null) {
		throw new Exception("tokenId required!");
	}
	if (empty($chainId)) {
		throw new Exception("chainId required!");
	}

    $texts = Q_Text::get('Assets/content');

	$nftInfo = Q::event("Assets/NFT/response/getInfo", compact("tokenId", "chainId"));
	if ($isJson) {
		header("Content-type: application/json");
		echo Q::json_encode(array(
			"name" => $nftInfo["data"]["name"],
			"description" => $nftInfo["data"]["description"],
			"external_url" => $nftInfo["url"],
			"image" => $nftInfo["data"]["image"],
			"animation_url" => $nftInfo["data"]["animation_url"],
			"attributes" => $nftInfo["data"]["attributes"]
		), JSON_PRETTY_PRINT);
		exit;
	}

	$user = Users_ExternalTo::select()->where(array(
		"xid" => $nftInfo["owner"]
	))->fetchDbRow();
	$ownerId = Q::ifset($user, "userId", null);

	$defaultIconSize = Q_Config::expect("Q", "images", "NFT/icon", "defaultSize");
	$sizes = Q_Config::expect("Q", "images", "NFT/icon", "sizes");
	$maxSize = end($sizes);

	Q_Response::addScript("{{Assets}}/js/pages/NFT.js");
	Q_Response::addStylesheet("{{Assets}}/css/pages/NFT.css");

	$keywords = Q::ifset($texts, 'profile', 'Keywords', null);
	Q_Response::setMeta(array(
		array('attrName' => 'name', 'attrValue' => 'title', 'content' => $nftInfo["data"]["name"]),
		array('attrName' => 'property', 'attrValue' => 'og:title', 'content' => $nftInfo["data"]["name"]),
		array('attrName' => 'property', 'attrValue' => 'twitter:title', 'content' => $nftInfo["data"]["name"]),
		array('attrName' => 'name', 'attrValue' => 'description', 'content' => $nftInfo["data"]["description"]),
		array('attrName' => 'property', 'attrValue' => 'og:description', 'content' => $nftInfo["data"]["description"]),
		array('attrName' => 'property', 'attrValue' => 'twitter:description', 'content' => $nftInfo["data"]["description"]),
		array('attrName' => 'name', 'attrValue' => 'keywords', 'content' => $keywords),
		array('attrName' => 'property', 'attrValue' => 'og:keywords', 'content' => $keywords),
		array('attrName' => 'property', 'attrValue' => 'twitter:keywords', 'content' => $keywords),
		array('attrName' => 'name', 'attrValue' => 'image', 'content' => $nftInfo["data"]["image"]),
		array('attrName' => 'property', 'attrValue' => 'og:image', 'content' => $nftInfo["data"]["image"]),
		array('attrName' => 'property', 'attrValue' => 'twitter:image', 'content' => $nftInfo["data"]["image"]),
		array('attrName' => 'property', 'attrValue' => 'og:url', 'content' => $url),
		array('attrName' => 'property', 'attrValue' => 'twitter:url', 'content' => $url),
		array('attrName' => 'property', 'attrValue' => 'twitter:card', 'content' => 'summary')
	));

	return Q::view('Assets/content/NFT.php', compact("texts", "defaultIconSize", "maxSize", "tokenId", "chainId", "nftInfo", "ownerId"));
}