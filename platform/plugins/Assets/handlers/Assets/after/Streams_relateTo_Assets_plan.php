<?php

function Assets_after_Streams_relateTo_Assets_plan ($params) {
	$category = $params['category'];
	$stream = $params['stream'];
	$type = $params['type'];

	if ($type != Assets_Subscription::$relationType) {
		return;
	}

	$access = new Streams_Access();
	$access->publisherId = "";
	$access->streamName = $stream->name;
	$access->ofUserId = '';
	$access->ofContactLabel = $category->name;
	$access->readLevel = 40;
	$access->save(true);
}