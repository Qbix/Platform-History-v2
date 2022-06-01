<?php
function Assets_NFTcontests_response_column () {
	$loggedInUser = Users::loggedInUser(true);
	$loggedInUserId = Q::ifset($loggedInUser, 'id', null);
	$isAdmin = (bool)Users::roles(null, 'Users/admins');
	if (!$isAdmin) {
		throw new Users_Exception_NotAuthorized();
	}

	Q_Response::addScript("{{Assets}}/js/columns/NFTcontests.js");
	Q_Response::addStylesheet("{{Assets}}/css/columns/NFTcontests.css");

	$communityId = Users::communityId();
	$text = Q_Text::get("Assets/content");
	$title = Q::ifset($text, "NFT", "contests", "Title", null);
	$description = Q::ifset($text, "NFT", "contests", "Description", null);
	$keywords = Q::ifset($text, "NFT", "contests", "Keywords", null);
	$url = Q_Uri::url("Assets/NFTcontests");
	$image = Q_Uri::interpolateUrl('{{baseUrl}}/img/icon/400.png');
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

	$column = Q::view('Assets/column/NFTcontests.php', @compact("loggedInUserId", "communityId"));

	$url = Q_Uri::url("Assets/NFTcontests");
	$columnsStyle = Q_Config::get('Communities', 'layout', 'columns', 'style', 'classic');

	$controls = null;
	/*(if ($columnsStyle == 'classic') {
		$showControls = Q_Config::get('Assets', 'NFTprofile', 'controls', true);
		$controls = $showControls ? Q::view('Assets/controls/NFTprofile.php') : null;
	}*/
	Assets::$columns['NFTcontests'] = array(
		'title' => $title,
		'column' => $column,
		'columnClass' => 'Assets_column_'.$columnsStyle,
		'controls' => $controls,
		'close' => false,
		'url' => $url
	);
	Q_Response::setSlot('controls', $controls);

	return $column;
}

