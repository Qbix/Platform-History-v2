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
	$isPublisher = $stream->publisherId == $event->publisherId;
	$isAdmin = Calendars_Event::isAdmin($stream->publisherId, $event->getAttribute("communityId"));
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

	if ($isPublisher || $isAdmin) {
		Streams_Message::post($stream->publisherId, $stream->publisherId, "Calendars/user/reminders", array(
			"type" => "Calendars/payment/skip",
			"instructions" => array(
				"publisherId" => $event->publisherId,
				"streamName" => $event->name,
				"reason" => $isPublisher ? "publisher" : "admin"
			)
		), true);

		return true;
	}

	$needCredits = Assets_Credits::convert($amount, $currency, "credits");
	$forcePayment = true;
	Assets_Credits::spend($needCredits, Assets::JOINED_PAID_STREAM, $stream->publisherId, compact("toPublisherId", "toStreamName", "fromPublisherId", "fromStreamName", "forcePayment"));
}