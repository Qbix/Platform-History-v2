<?php

/**
 * Used to post messages to EXISTING stream
 * $_REQUEST shall contain the content of the message. Also may include 'streamNames' 
 * field which is an array of additional names of the streams to post message to.
 *
 * @param string $params 
 *   publisher id and stream name of existing stream shall be supplied
 * @return {void}
 */

function Streams_message_post () {
	$user        = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId(true);
	$streamName  = Streams::requestedName(true);

	// check if type is allowed
	$streams = Streams::fetch($user->id, $publisherId, $streamName);
	if (empty($streams)) {
		throw new Streams_Exception_NoSuchStream();
	}
	$stream = reset($streams);
	if (empty($_REQUEST['type'])) {
		throw new Q_Exception_RequiredField(array('field' => 'type'), 'type');
	}

	$type = $_REQUEST['type'];
	if (!Q_Config::get("Streams", "types", $stream->type, "messages", $type, 'post', false)) {
		throw new Q_Exception("This app doesn't support directly posting messages of type '$type' for streams of type '{$stream->type}'");
	}

	$result = Streams_Message::post(
		$user->id,
		$publisherId,
		$streamName,
		$_REQUEST
	);
	if (is_array($result)) {
		Streams::$cache['messages'] = $result;		
	} else {
		Streams::$cache['message'] = $result;
	}
}