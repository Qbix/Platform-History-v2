<?php
function Assets_before_Streams_relateTo_Calendars_event ($params) {
	$event = $params['category'];
	$stream = $params['stream'];
	$publisherId = $event->publisherId;
	$streamName = $event->name;

	// check if stream payment required
	$amount = Q::ifset($event->getAttribute("payment"), "amount", null);
	$currency = Q::ifset($event->getAttribute("payment"), "currency", null);
	if (!$amount || !$currency) {
		return true;
	}

	// check if user participating event
	$participant = new Streams_Participant();
	$participant->publisherId = $event->publisherId;
	$participant->streamName = $event->name;
	$participant->userId = $stream->publisherId;
	$participant->state = 'participating';
	if (!$participant->retrieve()) {
		return true;
	}

	$needCredits = Assets_Credits::convertToCredits($amount, $currency);

	Assets_Credits::spend($needCredits, 'JoinPaidStream', $stream->publisherId, compact("publisherId", "streamName"));

	$extra = &$params['extra'];
	if (is_string($extra)) {
		$extra = Q::json_decode($extra);
	} elseif (!$extra) {
		$extra = array();
	}
	$extra = Q::json_encode(array_merge($extra, array('credits' => $needCredits)));
}