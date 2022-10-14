<?php
function Assets_subscription_response_column (&$params, &$result) {
	$texts = Q_Text::get('Assets/content');
	$communityId = Users::communityId();

	$columnsStyle = Q_Config::get('Communities', 'layout', 'columns', 'style', 'classic');
	$controls = null;
	/*(if ($columnsStyle == 'classic') {
		$showControls = Q_Config::get('Assets', 'billing', 'controls', true);
		$controls = $showControls ? Q::view('Assets/controls/billing.php') : null;
	}*/

	Q_Response::addStylesheet("{{Assets}}/css/columns/subscription.css");
	Q_Response::addStylesheet("{{Assets}}/js/columns/subscription.js");

	$column = Q::view('Assets/column/subscription.php', compact("communityId"));
	$title = $texts["admin"]["SubscriptionTitle"];
	$url = Q_Uri::url("Assets/subscription method=admin");
	Assets::$columns['subscription'] = array(
		'title' => $title,
		'column' => $column,
		'columnClass' => 'Assets_column_subscription Assets_column_'.$columnsStyle,
		'controls' => $controls,
		'close' => false,
		'url' => $url
	);
	Q_Response::setSlot('title', $title);
	Q_Response::setSlot('controls', $controls);

	return $column;
}

