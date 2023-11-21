<?php

function Assets_after_Streams_relateTo_Assets_plan ($params) {
	$plan = $params['category'];
	$stream = $params['stream'];
	$type = $params['type'];

	if ($type != Assets_Subscription::$relationType) {
		return;
	}

	Assets_Subscription::addAccess($plan, $stream);
}