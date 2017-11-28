<?php
	
function Places_areas_response_data()
{
	Q_Valid::requireFields(array('location'), $_REQUEST, true);

	$location = $_REQUEST["location"];
	Q_Valid::requireFields(array('latitude', 'longitude', 'venue'), $location, true);

	$appId = Q::app();

	$stream = Places_Location::stream($appId, $location['placeId'], true);

	return $stream;
}