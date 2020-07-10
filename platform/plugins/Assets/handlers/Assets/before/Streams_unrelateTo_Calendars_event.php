<?php
function Assets_before_Streams_unrelateTo_Calendars_event ($params) {
	$relatedTo = $params['relatedTo'];

	// check if relation was paid with credits
	$credits = $relatedTo->getExtra("credits");
	if (!$credits) {
		return true;
	}

	// check if event already started
	$event = Streams::fetchOne($relatedTo->toPublisherId, $relatedTo->toPublisherId, $relatedTo->toStreamName);
	if ((int)$event->getAttribute('startTime') <= time()) {
		return true;
	}

	Assets_Credits::send($credits, 'LeftPaidStream', $relatedTo->fromPublisherId, $relatedTo->toPublisherId, array(
		"publisherId" => $relatedTo->toPublisherId,
		"streamName" => $relatedTo->toStreamName
	));

	return true;
}