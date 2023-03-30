<?php
function Assets_NFTowned_response_column () {
	$userId = Users::loggedInUser(true)->id;

	Q_Response::addScript("{{Assets}}/js/columns/NFTowned.js");
	Q_Response::addStylesheet("{{Assets}}/css/columns/NFTowned.css");

	$column = Q::view('Assets/column/NFTowned.php', compact("userId"));

	$title = "NFT owned";

	$url = Q_Uri::url("Assets/NFTowned");
	$columnsStyle = Q_Config::get(
		'Q', 'response', 'layout', 'columns', 'style', 'classic'
	);

	$controls = null;
	/*(if ($columnsStyle == 'classic') {
		$showControls = Q_Config::get('Assets', 'NFTprofile', 'controls', true);
		$controls = $showControls ? Q::view('Assets/controls/NFTprofile.php') : null;
	}*/
	Assets::$columns['NFTowned'] = array(
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

