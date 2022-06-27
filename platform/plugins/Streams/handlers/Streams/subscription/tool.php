<?php

/**
 * Subscription tool
 * @param array $options
 *  "publisherId" => the id of the user who is publishing the stream
 *  "streamName" => the name of the stream for which to edit access levels
 */
function Streams_subscription_tool($options) {
	$subscribed = 'no';

	extract($options);

	$user = Users::loggedInUser(true);

	if (!isset($publisherId)) {
		$publisherId = Streams::requestedPublisherId(true);
	}

	if (!isset($streamName)) {
		$streamName = Streams::requestedName();
	}

	$stream = Streams_Stream::fetch($user->id, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table'    => 'stream',
			'criteria' => @compact('publisherId', 'streamName')
		));
	}

	$streams_participant 			  = new Streams_Participant();
	$streams_participant->publisherId = $publisherId;
	$streams_participant->streamName  = $streamName;
	$streams_participant->userId  	  = $user->id;
	if ($streams_participant->retrieve()) {
		$subscribed = $streams_participant->subscribed;
	}

	$types = Q_Config::get('Streams', 'types', $stream->type, 'messages', array());

	$messageTypes = array();
	foreach($types as $type => $msg) {
		$name = Q::ifset($msg, 'title', $type);

		/*
		* group by name
		*/
		foreach ($messageTypes as $msgType) {
			if ($msgType['name'] == $name) {
				continue 2;
			}
		}

		$messageTypes[] = array(
			'value' => $type,
			'name'  => $name
		);
	}

	$usersFetch = array(
		'userId' => $user->id,
		'state'  => 'active'
	);

	$devices = array();
	$emails  = Users_Email::select('address')->where($usersFetch)->fetchAll(PDO::FETCH_COLUMN);
	$mobiles = Users_Mobile::select('number')->where($usersFetch)->fetchAll(PDO::FETCH_COLUMN);

	foreach ($emails as $email) {
		$devices[] = array(
			'value' => Q::json_encode(array( 'email' => $email )),
			'name'  => 'my email'
		);
	}

	foreach ($mobiles as $mobile) {
		$devices[] = array(
			'value' => Q::json_encode(array( 'mobile' => $mobile )),
			'name'  => 'my mobile'
		);
	}

	$items = array();

	$rules = Streams_SubscriptionRule::select('deliver, filter')->where(array(
		'ofUserId'    => $user->id,
		'publisherId' => $publisherId,
		'streamName'  => $streamName
	))->fetchAll(PDO::FETCH_ASSOC);

	while ($rule = array_pop($rules)) {
		$filter = json_decode($rule['filter']);

		/*
		* group by name
		*/
		foreach ($rules as $val) {
			if (json_decode($val['filter'])->labels == $filter->labels) {
				continue 2;
			}
		}

		$items[] = array(
			'deliver' => json_decode($rule['deliver']),
			'filter'  => $filter
		);
	}

	Q_Response::addScript("{{Streams}}/js/Streams.js", 'Streams');
	Q_Response::addScript("{{Streams}}/js/tools/subscription.js", 'Streams');

	Q_Response::setToolOptions(@compact(
		'items',
		'subscribed',
		'messageTypes',
		'devices',
		'publisherId',
		'streamName'
	));
}