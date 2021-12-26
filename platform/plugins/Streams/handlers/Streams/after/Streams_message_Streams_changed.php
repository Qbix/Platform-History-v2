<?php
function Streams_after_Streams_message_Streams_changed($params) {
	$message = $params['message'];
	$changes = $message->getInstruction("changes");
	$stream = $params['stream'];

	$attributesChanged = Q::ifset($changes, "attributes", null);
	if (gettype($attributesChanged) == "string") {
		$attributesChanged = json_decode($attributesChanged, true);
	}
	$maxRelationsChanged = Q::ifset($attributesChanged, "Streams/maxRelations", null);
	// if maxRelations attr modified, check if new relations available and send appropriate messages
	if (!empty($maxRelationsChanged)) {
		foreach ($maxRelationsChanged as $relation => $value) {
			Streams::checkAvailableRelations($stream->publisherId, $stream->publisherId, $stream->name, $relation);
		}
	}
}