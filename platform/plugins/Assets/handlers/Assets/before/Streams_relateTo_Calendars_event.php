<?php
function Assets_before_Streams_relateTo_Calendars_event ($params) {
	$event = $params['category'];
	$toPublisherId = $event->publisherId;
	$toStreamName = $event->name;

	$stream = $params['stream'];
	$fromPublisherId = $stream->publisherId;
	$fromStreamName = $stream->name;

	// check if related stream type behave to the list of paid stream types
	$fromStreamType = $stream->type;
	$paidStreamTypes = Q_Config::get("Assets", "service", "relatedParticipants", null);
	if (!is_array($paidStreamTypes) || !in_array($fromStreamType, array_keys($paidStreamTypes))) {
		return true;
	}

	// check if stream payment required
	$amount = Q::ifset($event->getAttribute("payment"), "amount", null);
	$currency = Q::ifset($event->getAttribute("payment"), "currency", null);
	if (!$amount || !$currency) {
		return true;
	}

	// if user not participating to event, don't spend credits
	// will spend when user participated
	$participant = new Streams_Participant();
	$participant->publisherId = $event->publisherId;
	$participant->streamName = $event->name;
	$participant->userId = $stream->publisherId;
	$participant->state = 'participating';
	if (!$participant->retrieve()) {
		return true;
	}

	$needCredits = Assets_Credits::convert($amount, $currency, "credits");
	Assets_Credits::spend($needCredits, Assets::JOINED_PAID_STREAM, $stream->publisherId, compact("toPublisherId", "toStreamName", "fromPublisherId", "fromStreamName"));
}