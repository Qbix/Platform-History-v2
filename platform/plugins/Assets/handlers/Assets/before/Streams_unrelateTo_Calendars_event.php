<?php
function Assets_before_Streams_unrelateTo_Calendars_event ($params) {
	$relatedTo = $params['relatedTo'];

	// if event already started, don't refund credits
	$event = Streams::fetchOne($relatedTo->toPublisherId, $relatedTo->toPublisherId, $relatedTo->toStreamName);
	if ((int)$event->getAttribute('startTime') <= time()) {
		return true;
	}

	// get credits paid for this stream
	$assetsCredits = Assets_Credits::checkJoinPaid($relatedTo->fromPublisherId, array(
		'publisherId' => $relatedTo->toPublisherId,
		'streamName' => $relatedTo->toStreamName
	), array(
		'publisherId' => $relatedTo->fromPublisherId,
		'streamName' => $relatedTo->fromStreamName
	));

	if (!$assetsCredits) {
		return true;
	}

	Assets_Credits::send($assetsCredits->credits, Assets::LEFT_PAID_STREAM, $relatedTo->fromPublisherId, $relatedTo->toPublisherId, array(
		'toPublisherId' => $relatedTo->toPublisherId,
		'toStreamName' => $relatedTo->toStreamName,
		'fromPublisherId' => $relatedTo->fromPublisherId,
		'fromStreamName' => $relatedTo->fromStreamName
	));

	return true;
}