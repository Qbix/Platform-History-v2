<?php

function Places_location_post($params)
{
	$r = array_merge($_REQUEST, $params);

	// required fields
	Q_Valid::requireFields(array(
		'title',
		'attributes'
	), $r, true);

	// required attributes
	Q_Valid::requireFields(array(
		"placeId"
	), $r['attributes'], true);

	$data = Q::take($r, array('title', 'attributes'));

	$communityId = Users::communityId();
	$loggedUser = Users::loggedInUser(true);

	// get or create Places/location stream
	$globalStream = Places_Location::stream(null, $communityId, $data['attributes']['placeId'], true);

	if (!$globalStream instanceof Streams_Stream) {
		throw new Q_Exception_WrongValue(array(
			'field '=> 'location stream',
			'range' => 'valid Places/location stream'
		));
	}

	// copy this stream to user with selected title
	$userStream = Streams::fetchOne($loggedUser->id, $loggedUser->id, $globalStream->name);
	if (!$userStream instanceof Streams_Stream) {
		$userStream = Streams::create($loggedUser->id, $loggedUser->id, 'Places/location', array(
			'name' => $globalStream->name,
			'title' => $data['title'],
			'attributes' => $globalStream->attributes
		));
	}

	// relate stream to logged user Places/user/locations category
	$userStream->relateTo(
		(object)array('publisherId' => $loggedUser->id, 'name' => 'Places/user/locations'),
		'Places/locations'
	);

	$globalStream->addPreloaded();
	Q_Response::setSlot('data', array(
		'publisherId' => $globalStream->publisherId,
		'streamName' => $globalStream->name,
		'wasRetrieved' => $globalStream->wasRetrieved()
	));
}