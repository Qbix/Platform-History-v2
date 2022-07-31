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

	// try to get stream
	$stream = Streams_Stream::fetch(null, $tokenId, "Assets/NFT/".$chainId);
	if ($stream) {
		if (preg_match("/\.\w{3,4}$/", $stream->icon)) {
			$image = Q::interpolate($stream->icon, array("baseUrl" => Q_Request::baseUrl()));
		} else {
			foreach (array("original", "x", "2048", "700x", "700x980") as $size) {
				$image = $stream->iconUrl($size.'.png');
				if (is_file(Q_Uri::filenameFromUrl($image))) {
					break;
				}
			}
		}
		$assetsNFTAttributes = $stream->getAttribute('Assets/NFT/attributes', array());
		if ($isJson) {
			header("Content-type: application/json");
			echo Q::json_encode(array(
				"name" => $stream->title,
				"description" => $stream->content,
				"external_url" => $url,
				"image" => $image,
				"animation_url" => $stream->getAttribute('animation_url'),
				"attributes" => $assetsNFTAttributes,
			), JSON_PRETTY_PRINT);
			exit;
		}

		$tokenId = $stream->getAttribute("tokenId");
		$chainId = $stream->getAttribute("chainId");
	}

	$nftInfo = Q::event("Assets/NFT/response/getInfo", compact("tokenId", "chainId"));
	if ($isJson) {
		header("Content-type: application/json");
		echo Q::json_encode(array(
			"name" => $nftInfo["data"]["name"],
			"description" => $nftInfo["data"]["description"],
			"external_url" => $nftInfo["tokenURI"],
			"image" => $nftInfo["data"]["image"],
			"animation_url" => $nftInfo["data"]["animation_url"],
			"attributes" => $nftInfo["data"]["attributes"]
		), JSON_PRETTY_PRINT);
		exit;
	}

	$title = $stream->title;
	$description = $stream->content;
	$icon = $stream->iconUrl('700x980.png');
	$royalty = $stream->getAttribute("royalty");
	$relations = Streams_RelatedTo::select()->where(array(
		"fromPublisherId" => $stream->publisherId,
		"fromStreamName" => $stream->name,
		"type" => "NFT/interest"
	))->fetchDbRows();
	$collections = array();
	foreach ($relations as $relation) {
		$interest = Streams_Stream::fetch(null, $relation->toPublisherId, $relation->toStreamName);
		$collections[] = $interest->title;
	}

	// get likes
	$res = false;
	if ($loggedInUserId) {
		$res = (boolean)Streams_Stream::countLikes($publisherId, $stream->name, $loggedInUserId);
	}
	$likes = array(
		"res" => $res,
		"likes" => Streams_Stream::countLikes($publisherId, $stream->name)
	);
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
		array('name' => 'name', 'value' => 'title', 'content' => $nftInfo["data"]["name"]),
		array('name' => 'property', 'value' => 'og:title', 'content' => $nftInfo["data"]["name"]),
		array('name' => 'property', 'value' => 'twitter:title', 'content' => $nftInfo["data"]["name"]),
		array('name' => 'name', 'value' => 'description', 'content' => $nftInfo["data"]["description"]),
		array('name' => 'property', 'value' => 'og:description', 'content' => $nftInfo["data"]["description"]),
		array('name' => 'property', 'value' => 'twitter:description', 'content' => $nftInfo["data"]["description"]),
		array('name' => 'name', 'value' => 'keywords', 'content' => $keywords),
		array('name' => 'property', 'value' => 'og:keywords', 'content' => $keywords),
		array('name' => 'property', 'value' => 'twitter:keywords', 'content' => $keywords),
		array('name' => 'name', 'value' => 'image', 'content' => $nftInfo["data"]["image"]),
		array('name' => 'property', 'value' => 'og:image', 'content' => $nftInfo["data"]["image"]),
		array('name' => 'property', 'value' => 'twitter:image', 'content' => $nftInfo["data"]["image"]),
		array('name' => 'property', 'value' => 'og:url', 'content' => $url),
		array('name' => 'property', 'value' => 'twitter:url', 'content' => $url),
		array('name' => 'property', 'value' => 'twitter:card', 'content' => 'summary')
	));

	return Q::view('Assets/content/NFT.php', compact("texts", "defaultIconSize", "maxSize", "tokenId", "chainId", "nftInfo", "ownerId"));
}