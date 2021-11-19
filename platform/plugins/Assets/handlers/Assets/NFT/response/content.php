<?php
function Assets_NFT_response_content ($params) {
	$loggedInUser = Users::loggedInUser();
	$r = array_merge($_REQUEST, $params);
	$uri = Q_Dispatcher::uri();
	$loggedInUserId = Q::ifset($r, 'userId', Q::ifset($uri, 'userId', $loggedInUser->id));
	$publisherId = Q::ifset($r, 'publisherId', Q::ifset($uri, 'publisherId', null));
	$lastPart = Q::ifset($r, 'tokenId', Q::ifset($uri, 'lastPart', null));

	$needle = ".json";
	$isJson = substr_compare($lastPart, $needle, -strlen($needle)) === 0;
	if ($isJson) {
		$lastPart = str_replace($needle, "", $lastPart);
	}

	if (empty($publisherId)) {
		throw new Exception("NFT::view publisherId required!");
	}
	if (empty($lastPart)) {
		throw new Exception("NFT::view tokeId required!");
	}

    $communityId = Users::communityId();
    $texts = Q_Text::get($communityId.'/content');

	$stream = Streams::fetchOne(null, $publisherId, "Assets/NFT/".$lastPart);
	$url = implode("/", array(Q_Request::baseUrl(), "NFT", $stream->publisherId, $lastPart));
	$image = $stream->iconUrl('500x700.png');
	$author = $stream->getAttribute("author");
	$owner = $stream->getAttribute("owner");

	if ($isJson) {
		echo Q::json_encode(array(
			"name" => $stream->title,
			"description" => $stream->content,
			"external_url" => $url,
			"image" => $image,
			"attributes" => $stream->getAllAttributes()
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
		$interest = Streams::fetchOne(null, $relation->toPublisherId, $relation->toStreamName);
		$collections[] = $interest->title;
	}

	// get likes
	$res = false;
	if ($loggedInUserId) {
		$res = (boolean)Assets::getLikes($publisherId, $stream->name, $loggedInUserId);
	}
	$likes = array(
		"res" => $res,
		"likes" => Assets::getLikes($publisherId, $stream->name)
	);

	$defaultIconSize = Q_Config::expect("Q", "images", "NFT/icon", "defaultSize");
	$sizes = Q_Config::expect("Q", "images", "NFT/icon", "sizes");
	$maxSize = end($sizes);

	Q_Response::addScript("js/pages/NFT.js");
	Q_Response::addStylesheet("css/pages/NFT.css");
	Q_Response::setScriptData("Assets.NFT.publisherId", $stream->publisherId);
	Q_Response::setScriptData("Assets.NFT.streamName", $stream->name);

	$keywords = Q::ifset($texts, 'profile', 'Keywords', null);
	Q_Response::setMeta(array(
		array('attrName' => 'name', 'attrValue' => 'title', 'content' => $title),
		array('attrName' => 'property', 'attrValue' => 'og:title', 'content' => $title),
		array('attrName' => 'property', 'attrValue' => 'twitter:title', 'content' => $title),
		array('attrName' => 'name', 'attrValue' => 'description', 'content' => $description),
		array('attrName' => 'property', 'attrValue' => 'og:description', 'content' => $description),
		array('attrName' => 'property', 'attrValue' => 'twitter:description', 'content' => $description),
		array('attrName' => 'name', 'attrValue' => 'keywords', 'content' => $keywords),
		array('attrName' => 'property', 'attrValue' => 'og:keywords', 'content' => $keywords),
		array('attrName' => 'property', 'attrValue' => 'twitter:keywords', 'content' => $keywords),
		array('attrName' => 'name', 'attrValue' => 'image', 'content' => $image),
		array('attrName' => 'property', 'attrValue' => 'og:image', 'content' => $image),
		array('attrName' => 'property', 'attrValue' => 'twitter:image', 'content' => $image),
		array('attrName' => 'property', 'attrValue' => 'og:url', 'content' => $url),
		array('attrName' => 'property', 'attrValue' => 'twitter:url', 'content' => $url),
		array('attrName' => 'property', 'attrValue' => 'twitter:card', 'content' => 'summary')
	));

	$fixedPrice = $stream->getAttribute("fixedPrice");
	$timedAuction = $stream->getAttribute("timedAuction");
	$price = "$".number_format($fixedPrice["price"] ?: 1666, 2);
	$currency = null;
	if (Q::ifset($fixedPrice, "active", false) === "true") {
		$price = number_format($fixedPrice["price"], 2);
		$currency = Q::ifset($fixedPrice, "currency", null);
	} else if (Q::ifset($timedAuction, "active", false) === "true") {
		$price = number_format($timedAuction["price"], 2);
		$currency = Q::ifset($timedAuction, "currency", null);
	}

	if ($publisherId == "iqxtztie") {
		$price = "$".number_format(1666, 2);
		$currency = null;
	}

	$authorName = Streams::displayName($publisherId, array("fullAccess" => true, "show" => "f l"));

	$movie = Q::interpolate($stream->getAttribute("video") ?: $stream->getAttribute("Q.file.url"), array("baseUrl" => Q_Request::baseUrl()));
	$poster = Q::interpolate($stream->iconUrl($maxSize.'.png') ? $stream->iconUrl($maxSize.'.png') : "", array("baseUrl" => Q_Request::baseUrl()));

	return Q::view('Assets/content/NFT.php', compact("stream", "author", "authorName", "owner", "icon", "royalty", "collections", "likes", "texts", "defaultIconSize", "maxSize", "price", "currency", "movie", "poster"));
}