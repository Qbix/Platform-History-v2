<?php
function Assets_NFTcollections_response_column () {
	$loggedInUser = Users::loggedInUser(true);
	$loggedInUserId = Q::ifset($loggedInUser, 'id', null);
	$isAdmin = (bool)Users::roles(null, 'Users/admins');
	if (!$isAdmin) {
		throw new Users_Exception_NotAuthorized();
	}

	Q_Response::addScript("{{Assets}}/js/columns/NFTcollections.js");
	Q_Response::addStylesheet("{{Assets}}/css/columns/NFTcollections.css");

	$communityId = Users::communityId();
	$text = Q_Text::get("Assets/content");
	$title = Q::ifset($text, "NFT", "collections", "Title", null);
	$description = Q::ifset($text, "NFT", "collections", "Description", null);
	$keywords = Q::ifset($text, "NFT", "collections", "Keywords", null);
	$url = Q_Uri::url("Assets/NFTcollections");
	$image = Q_Uri::interpolateUrl('{{baseUrl}}/img/icon/400.png');
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

	$column = Q::view('Assets/column/NFTcollections.php', @compact("loggedInUserId", "communityId"));

	$url = Q_Uri::url("Assets/NFTcollections");
	$columnsStyle = Q_Config::get(
		'Q', 'response', 'layout', 'columns', 'style', 'classic'
	);

	$controls = null;
	/*(if ($columnsStyle == 'classic') {
		$showControls = Q_Config::get('Assets', 'NFTprofile', 'controls', true);
		$controls = $showControls ? Q::view('Assets/controls/NFTprofile.php') : null;
	}*/
	Assets::$columns['NFTcollections'] = array(
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

