<?php
function Assets_subscription_response_data ($params) {
	$request = array_merge($_REQUEST, $params);
	$user = Users::loggedInUser(true);

	// collect subscribed plans
	$subscribed = array();
	$query = Streams_Stream::select("srt.*, ss.*", "ss")
		->where(array(
			'ss.publisherId' => $user->id,
			'ss.type' => Assets_Subscription::$streamType,
			'srt.type' => Assets_Subscription::$streamType
		))
		->join(Streams_RelatedTo::table() . ' srt', array(
			'srt.fromPublisherId' => 'ss.publisherId',
			'srt.fromStreamName' => 'ss.name',
	), 'LEFT')->fetchDbRows();
	foreach ($query as $item) {
		$subscriptionStream = Streams::fetchOne(null, $item->fromPublisherId, $item->fromStreamName);
		if (!Assets_Subscription::isCurrent($subscriptionStream)) {
			continue;
		}

		$subscribed[$item->toPublisherId][$item->toStreamName] = true;
	}

	return @compact("subscribed");
}