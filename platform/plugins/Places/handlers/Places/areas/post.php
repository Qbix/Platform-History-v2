<?php

function Places_areas_post()
{
	Q_Valid::requireFields(array('location'), $_REQUEST, true);
	$location = $_REQUEST["location"];
	$communityId = Users::communityId();
	$stream = Places_Location::stream(null, $communityId, $location['placeId'], true);
	$stream->addPreloaded();
	Q_Response::setSlot('data', array(
		'publisherId' => $stream->publisherId,
		'streamName' => $stream->name,
		'wasRetrieved' => $stream->wasRetrieved()
	));
}