<?php

function Streams_subscribe_post()
{
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	$streamName = Streams::requestedName(true);
	$stream = Streams::fetchOne($user->id, $publisherId, $streamName, true);
	// SECURITY: Do not allow client to set options here
	// because then they can set participant extra.
	if ($participant = $stream->subscribe()) {
		Q_Response::setSlot('participant', $participant->exportArray());
	}

	// if skit totalSubscribed requested, calculate total subscribed and return
	if (Q_Request::slotName("totalSubscribed")) {
		$subscribers = Streams_Participant::select("count(*) as res")->where(array(
			"publisherId" => $publisherId,
			"streamName" => $streamName,
			"userId !=" => $publisherId,
			"subscribed" => "yes"
		))->execute()->fetchAll(PDO::FETCH_ASSOC)[0]["res"];

		Q_Response::setSlot("totalSubscribed", $subscribers);
	}
}