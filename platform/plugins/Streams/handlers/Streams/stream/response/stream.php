<?php

function Streams_stream_response_stream()
{
	// happens only during non-GET requests
	if (isset(Streams::$cache['stream'])) {
		return Streams::$cache['stream']->exportArray();
	}
	
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	$fields = Streams::requestedFields();
	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	$options = array('withParticipant' => true, 'refetch' => true);
	if (!empty($_REQUEST['messageTotals'])) {
		$options['withMessageTotals'][$name] = $_REQUEST['messageTotals'];
	}

	Streams::$cache['stream'] = $stream = Streams::fetchOne(
		$userId, $publisherId, $name, $fields, $options
	);
	return $stream ? $stream->exportArray() : null;
}