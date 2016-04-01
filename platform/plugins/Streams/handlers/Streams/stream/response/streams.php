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

	$options = array('withParticipant' => true);
	if (isset($limit)) {
		$options['limit'] = $limit;
	}
	$streams = Streams::fetch(
		$userId,
		$publisherId,
		$name,
		$fields ? $fields : '*',
		$options
	);
	return Streams::$cache['streams'] = Db::exportArray($streams);
}