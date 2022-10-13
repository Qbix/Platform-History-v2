<?php
function Assets_after_Assets_credits_spent ($params) {
	$userId = $params['userId'];
	$amount = $params['amount'];
	$publisherId = $params['toPublisherId'];
	$streamName = $params['toStreamName'];

	$user = Users::fetch($userId, true);
	if ($publisherId && $streamName) {
		$stream = Streams::fetchOne($publisherId, $publisherId, $streamName, true);

		if ($stream->type === 'Assets/plan') {
			Assets_Subscription::start($stream, $user);
		}
	}
}