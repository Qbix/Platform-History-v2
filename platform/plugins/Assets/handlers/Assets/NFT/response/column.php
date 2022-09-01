<?php
function Assets_NFT_response_column (&$params, &$result) {
	$request = array_merge($_REQUEST, $params);
	$uri = Q_Dispatcher::uri();

	$publisherId = Q::ifset($request, 'publisherId', Q::ifset($uri, 'publisherId', null));
	$streamId = Q::ifset($request, 'streamId', Q::ifset($uri, 'streamId', null));

	if (empty($publisherId)) {
		throw new Exception("NFT::view publisherId required!");
	}
	if (empty($streamId)) {
		throw new Exception("NFT::view streamId required!");
	}

	$streamName = "Assets/NFT/".$streamId;
	$communityId = Users::communityId();
	$texts = Q_Text::get(array("Assets/content", $communityId."/content"));
	$stream = Q::ifset($request, "stream", Streams_Stream::fetch(null, $publisherId, $streamName, true));
	$authorName = Users_User::fetch($publisherId, true)->displayName();
	$assetsNFTAttributes = $stream->getAttribute('Assets/NFT/attributes', array());
	$title = $stream->title;
	$description = $stream->content;

	$relations = Streams_RelatedTo::select()->where(array(
		"fromPublisherId" => $stream->publisherId,
		"fromStreamName" => $stream->name,
		"type" => "NFT/interest"
	))->fetchDbRows();
	$interests = array();
	foreach ($relations as $relation) {
		$interest = Streams_Stream::fetch(null, $relation->toPublisherId, $relation->toStreamName);
		$interests[] = $interest->title;
	}

	// get likes
	/*$res = false;
	$loggedInUser = Users::loggedInUser();
	if ($loggedInUserId) {
		$res = (boolean)TokenSociety::getLikes($publisherId, $stream->name, $loggedInUserId);
	}
	$likes = array(
		"res" => $res,
		"likes" => TokenSociety::getLikes($publisherId, $stream->name)
	);*/

	Q_Response::addScript("{{Assets}}/js/columns/NFT.js");
	Q_Response::addStylesheet("{{Assets}}/css/columns/NFT.css");

	$isAdmin = (bool)Users::roles(null, 'Users/admins');

	$keywords = Q::ifset($texts, 'NFT', 'Keywords', null);
	$image = $stream->iconUrl("x");
	$url = Q_Uri::url("Assets/NFT publisherId=$publisherId streamId=$streamId");
	Q_Response::setMeta(array(
		array('name' => 'name', 'value' => 'title', 'content' => $title),
		array('name' => 'property', 'value' => 'og:title', 'content' => $title),
		array('name' => 'property', 'value' => 'twitter:title', 'content' => $title),
		array('name' => 'name', 'value' => 'description', 'content' => $description),
		array('name' => 'property', 'value' => 'og:description', 'content' => $description),
		array('name' => 'property', 'value' => 'twitter:description', 'content' => $description),
		array('name' => 'name', 'value' => 'keywords', 'content' => $keywords),
		array('name' => 'property', 'value' => 'og:keywords', 'content' => $keywords),
		array('name' => 'property', 'value' => 'twitter:keywords', 'content' => $keywords),
		array('name' => 'name', 'value' => 'image', 'content' => $image),
		array('name' => 'property', 'value' => 'og:image', 'content' => $image),
		array('name' => 'property', 'value' => 'twitter:image', 'content' => $image),
		array('name' => 'property', 'value' => 'og:url', 'content' => $url),
		array('name' => 'property', 'value' => 'twitter:url', 'content' => $url),
		array('name' => 'property', 'value' => 'twitter:card', 'content' => 'summary')
	));
	$movie = Q::interpolate($stream->getAttribute("video") ?: $stream->getAttribute("animation_url"), array("baseUrl" => Q_Request::baseUrl()));
	$src = $stream->getAttribute("src") ?: $image;

	$column = Q::view('Assets/column/NFT.php', @compact(
		"stream", "icon", "interests", "likes", "texts", "authorName",
		"movie", "image", "src", "isAdmin", "assetsNFTAttributes"
	));

	$columnsStyle = Q_Config::get('Communities', 'layout', 'columns', 'style', 'classic');

	$controls = null;
	/*(if ($columnsStyle == 'classic') {
		$showControls = Q_Config::get('Assets', 'NFT', 'controls', true);
		$controls = $showControls ? Q::view('Assets/controls/NFT.php') : null;
	}*/
	Assets::$columns['NFT'] = array(
		'title' => $title,
		'column' => $column,
		'columnClass' => 'Assets_column_NFT Assets_column_'.$columnsStyle,
		'controls' => $controls,
		'close' => false,
		'url' => $url
	);
	Q_Response::setSlot('title', $title);
	Q_Response::setSlot('controls', $controls);

	return $column;
}

