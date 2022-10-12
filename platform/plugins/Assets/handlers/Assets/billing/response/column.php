<?php
function Assets_billing_response_column (&$params, &$result) {
	$texts = Q_Text::get('Assets/content')['billing'];
	$user = Users::loggedInUser(true);
	$creditsStream = Assets_Credits::userStream();
	$creditsMinimum = (int)$creditsStream->getAttribute("creditsMin") ?: Q_Config::expect("Assets", "credits", "amount", "min");
	$creditsAdd = (int)$creditsStream->getAttribute("creditsAdd") ?: Q_Config::expect("Assets", "credits", "amount", "add");

	Q_Response::addStylesheet("{{Assets}}/css/columns/billing.css");
	Q_Response::addStylesheet("{{Assets}}/js/columns/billing.js");

	$column = Q::view('Assets/column/billing.php', @compact("texts", "user", "creditsStream", "creditsMinimum", "creditsAdd"));

	$columnsStyle = Q_Config::get('Communities', 'layout', 'columns', 'style', 'classic');

	$controls = null;
	/*(if ($columnsStyle == 'classic') {
		$showControls = Q_Config::get('Assets', 'billing', 'controls', true);
		$controls = $showControls ? Q::view('Assets/controls/billing.php') : null;
	}*/

	$title = $texts["Title"];
	$url = Q_Uri::url("Assets/billing");
	Assets::$columns['billing'] = array(
		'title' => $title,
		'column' => $column,
		'columnClass' => 'Assets_column_billing Assets_column_'.$columnsStyle,
		'controls' => $controls,
		'close' => false,
		'url' => $url
	);
	Q_Response::setSlot('title', $title);
	Q_Response::setSlot('controls', $controls);

	return $column;
}

