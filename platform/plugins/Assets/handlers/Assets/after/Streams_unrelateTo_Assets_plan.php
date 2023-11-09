<?php

function Assets_after_Streams_unrelateTo_Assets_plan ($params) {
	$relatedTo = $params['relatedTo'];

	if ($relatedTo->type != Assets_Subscription::$relationType) {
		return;
	}

	$access = new Streams_Access();
	$access->publisherId = '';
	$access->streamName = $relatedTo->fromStreamName;
	$access->ofUserId = '';
	$access->ofContactLabel = $relatedTo->toStreamName;
	if ($access->retrieve()) {
		$access->remove();
	}
}