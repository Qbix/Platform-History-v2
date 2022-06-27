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
	$wNames = array('withMessageTotals', 'withRelatedToTotals', 'withRelatedFromTotals');
	foreach ($wNames as $wn) {
		if (!empty($_REQUEST[$wn])) {
			$options[$wn][$name] = $_REQUEST[$wn];
		}
	}

	Streams::$cache['stream'] = $stream = Streams_Stream::fetch(
		$userId, $publisherId, $name, $fields, $options
	);
	return $stream ? $stream->exportArray() : null;
}