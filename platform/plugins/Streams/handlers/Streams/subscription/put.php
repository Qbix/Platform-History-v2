<?php

/**
 * Create or update subscription
 */
function Streams_subscription_put($params) {
	$items          = array();
	$subscribed     = 'no';
	$updateTemplate = true;
	$streamName     = Streams::requestedName();
	$publisherId    = Streams::requestedPublisherId(true);
	$user           = Users::loggedInUser(true);

	extract($_REQUEST);

	$items  = json_decode($items, true);
	$stream = Streams_Stream::fetch($user->id, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table'    => 'stream',
			'criteria' => @compact('publisherId', 'streamName')
		));
	}

	$rules = Streams_SubscriptionRule::select()->where(array(
		'ofUserId'    => $user->id,
		'publisherId' => $publisherId,
		'streamName'  => $streamName
	))->fetchDbRows(null, '', 'ordinal');

	$types = Q_Config::get('Streams', 'types', $stream->type, 'messages', array());

	if ($subscribed !== 'no') {
		// update rules
		while ($item = array_pop($items)) {
			// join "grouped" message types to $items
			foreach ($types as $type => $msg) {
				if ($msg['title'] == $item['filter']->labels
				and $type != $item['filter']->types) {
					$items[] = (object) array(
						'deliver' => $item->deliver,
						'filter'  => array(
							'types'         => $type,
							'labels'        => $msg['title'],
							'notifications' => $item['filter']->notifications
						)
					);
				}
			}

			if (!$rule = array_pop($rules)) {
				$rule              = new Streams_SubscriptionRule();
				$rule->ofUserId    = $user->id;
				$rule->publisherId = $publisherId;
				$rule->streamName  = $streamName;
				$rule->relevance   = 1;
			}

			$rule->filter          = Q::json_encode($item['filter']);
			$rule->deliver         = Q::json_encode($item['deliver']);
			$rule->save();
		}
	}

	foreach ($rules as $rule) {
		$rule->remove();
	}

	$streams_subscription              = new Streams_Subscription();
	$streams_subscription->streamName  = $streamName;
	$streams_subscription->publisherId = $publisherId;
	$streams_subscription->ofUserId    = $user->id;
	$streams_subscription->filter      = Q::json_encode(array());
	$streams_subscription->retrieve();

	$streams_participant               = new Streams_Participant();
	$streams_participant->publisherId  = $publisherId;
	$streams_participant->streamName   = $streamName;
	$streams_participant->userId       = $user->id;
	$streams_participant->state        = 'participating';
	$streams_participant->reason       = '';
	$streams_participant->retrieve();
	$streams_participant->subscribed   = $subscribed;
	$streams_participant->save();

	if ($subscribed === 'yes') {
		$stream->subscribe(array('skipRules' => true));
	} else {
		$stream->unsubscribe();
	}
}