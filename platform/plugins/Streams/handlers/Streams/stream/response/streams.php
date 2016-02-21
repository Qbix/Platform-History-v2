<?php

function Streams_stream_response_streams()
{
	// happens only during non-GET requests
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	$fields = Streams::requestedFields();
	$limit = isset($_REQUEST['limit']) ? $_REQUEST['limit'] : null;

	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";

	$streams = Streams::fetch(
		$userId,
		$publisherId,
		$name,
		$fields ? $fields : '*',
		$limit ? compact('limit') : array());
	return Streams::$cache['streams'] = Db::exportArray($streams);
}