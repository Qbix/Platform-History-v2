<?php
function Assets_subscription_response_data ($params) {
	$request = array_merge($_REQUEST, $params);
	$loggedInUse = Users::loggedInUser();
	$loggedInUseId = Q::ifset($loggedInUse, "id", null);

	// collect subscribed plans
	$subscribed = array();
	$query = Streams_Stream::select("srt.*, ss.*", "ss")
		->where(array(
			'ss.publisherId' => $loggedInUseId,
			'ss.type' => Assets_Subscription::$streamType,
			'srt.type' => Assets_Subscription::$streamType
		))
		->join(Streams_RelatedTo::table(true, 'srt'), array(
			'srt.fromPublisherId' => 'ss.publisherId',
			'srt.fromStreamName' => 'ss.name',
	), 'LEFT')->fetchDbRows();
	foreach ($query as $item) {
		$subscriptionStream = Streams::fetchOne(null, $item->fromPublisherId, $item->fromStreamName);
		if (!Assets_Subscription::isCurrent($subscriptionStream)) {
			continue;
		}

		$subscribed[$item->toPublisherId][$item->toStreamName] = array(
			'publisherId' => $subscriptionStream->publisherId,
			'streamName' => $subscriptionStream->name
		);
	}

	return @compact("subscribed");
}