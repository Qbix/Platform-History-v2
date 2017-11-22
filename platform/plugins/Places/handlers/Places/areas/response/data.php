<?php
	
function Places_areas_response_data()
{
	Q_Valid::requireFields(array('location'), $_REQUEST, true);

	$location = $_REQUEST["location"];
	Q_Valid::requireFields(array('latitude', 'longitude', 'venue'), $location, true);

	$app = Q::app();

	$stream = new Streams_Stream();
	$stream->publisherId = $app;
	$stream->type = "Places/location";
	$stream->title = $location["venue"];
	$stream->setAttribute("latitude", $location["latitude"]);
	$stream->setAttribute("longitude", $location["longitude"]);

	if(!$stream->retrieve()) {
		$stream->save();
	}

	return $stream;
}