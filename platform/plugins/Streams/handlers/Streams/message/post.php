<?php

/**
 * @module Streams
 */

/**
 * Used to post a message to an existing stream.
 * @class HTTP Streams message
 * @method post
 * @param {array} [$_REQUEST] Parameters that can come from the request
 *   @param {string} $_REQUEST.publisherId  Required. The id of the user to publish the stream.
 *   @param {string} $_REQUEST.streamName Required streamName or name. The name of the stream.
 *   @param {string} $_REQUEST.type Required. The type of the message.
 *   @param {string} [$_REQUEST.content=''] Optional human-readable content of the message
 *   @param {string} [$_REQUEST.instructions=''] Optional JSON instructions of the message
 *   @param {string} [$_REQUEST.weight=1] Optional weight of the message
 * @return {void}
 */

function Streams_message_post () {
	$user        = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId(true);
	$streamName  = Streams::requestedName(true);

	// check delay between messages
	$delay = (int)Q_Config::get("Streams", "chat", "delay", null);
	if ($delay) {
		$delayTime = time() - $delay;
		$delayedMessage = Streams_Message::select()->where(array(
			"publisherId" => $publisherId,
			"streamName" => $streamName,
			"byUserId" => $user->id
		))->andWhere(new Db_Expression(
			"UNIX_TIMESTAMP(insertedTime) > ".$delayTime
		))->orderBy("insertedTime", false)->fetchDbRow();
		if ($delayedMessage) {
			throw new Q_Exception("Delay between messages ".$delay." seconds (".(strtotime($delayedMessage->insertedTime) - $delayTime)." seconds left).");
		}
	}

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
	if (!Streams_Stream::getConfigField($stream->type, "messages", $type, 'post', false)) {
		throw new Q_Exception("This app doesn't support directly posting messages of type '$type' for streams of type '{$stream->type}'");
	}
	
	if (Streams_Stream::getConfigField($stream->type, "messages", "$type", 'autosubscribe', false)) {
		$stream->subscribe();
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