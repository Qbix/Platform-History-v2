<?php
function Assets_plan_response_column ($params) {
	$request = array_merge($_REQUEST, $params);
	$uri = Q_Dispatcher::uri();
	$planId = Q::ifset($request, "planId", Q::ifset($uri, "planId", null));
	$publisherId = Q::ifset($request, "publisherId", Q::ifset($uri, "publisherId", null));
	$streamName = "Assets/plan/".$planId;
	$stream = Streams::fetchOne(null, $publisherId, $streamName, true);

	$columnsStyle = Q_Config::get("Q", "response", "layout", "columns", "style", "classic");
	$controls = null;
	/*(if ($columnsStyle == 'classic') {
		$showControls = Q_Config::get('Assets', 'billing', 'controls', true);
		$controls = $showControls ? Q::view('Assets/controls/billing.php') : null;
	}*/

	Q_Response::addStylesheet("{{Assets}}/css/columns/plan.css");
	Q_Response::addStylesheet("{{Assets}}/js/columns/plan.js");

	$params = compact("publisherId", "streamName");
	$column = Q::view('Assets/column/plan.php', compact("params"));
	$url = Q_Uri::url("Assets/plan publisherId=".$publisherId." planId=".$planId);
	Assets::$columns['plan'] = array(
		'title' => $stream->title,
		'column' => $column,
		'columnClass' => 'Assets_column_plan Assets_column_'.$columnsStyle,
		'controls' => $controls,
		'close' => false,
		'url' => $url
	);
	Q_Response::setSlot('title', $stream->title);
	Q_Response::setSlot('controls', $controls);

	return $column;
}

