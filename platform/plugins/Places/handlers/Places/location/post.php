<?php

function Places_location_post($params)
{
	$r = array_merge($_REQUEST, $params);

	// required fields
	Q_Valid::requireFields(array(
		'publisherId',
		'title',
		'attributes'
	), $r, true);

	// required attributes
	Q_Valid::requireFields(array(
		"placeId"
	), $r['attributes'], true);

	$data = Q::take($r, array('publisherId', 'title', 'attributes'));

	$communityId = Users::communityId();
	$publisherId = $data['publisherId'];

	// get or create Places/location stream
	$globalStream = Places_Location::stream(null, $communityId, $data['attributes']['placeId'], true);

	if (!$globalStream instanceof Streams_Stream) {
		throw new Q_Exception_WrongValue(array(
			'field '=> 'location stream',
			'range' => 'valid Places/location stream'
		));
	}

	// copy this stream to user with selected title
	$userStream = Streams::fetchOne($publisherId, $publisherId, $globalStream->name);
	if (!$userStream instanceof Streams_Stream) {
		$userStream = Streams::create($publisherId, $publisherId, 'Places/location', array(
			'name' => $globalStream->name,
			'title' => $data['title'],
			'attributes' => $globalStream->attributes
		));
	}

	// relate stream to logged user Places/user/locations category
	$userStream->relateTo(
		(object)array('publisherId' => $publisherId, 'name' => 'Places/user/locations'),
		'Places/locations'
	);

	$globalStream->addPreloaded();
	Q_Response::setSlot('data', array(
		'publisherId' => $globalStream->publisherId,
		'streamName' => $globalStream->name,
		'wasRetrieved' => $globalStream->wasRetrieved()
	));
}