<?php
/**
 * @module Streams
 */
/**
 *
 * @class Streams_Topic
 * @extends Base_Streams_Topic
 */
class Streams_Topic {
	/**
	 * Get or create new Streams/topic empty stream for composer
	 * @method getComposerStream
	 * @param {string} [$publisherId=null] - If null loggedin user id used
	 * @param {array} [$category=null] - array("publisherId" => ..., "streamName" => ...), if defined, use this stream as category for topic composer
	 * @return {Streams_Stream}
	 */
	static function getComposerStream ($publisherId = null, $category = null) {
		$publisherId = $publisherId ? $publisherId : Users::loggedInUser(true)->id;
		if (!($category instanceof Streams_Stream)) {
			$category = Streams_Stream::fetch(null, $category["publisherId"], $category["streamName"], true);
		}

		$streams = Streams::related(null, $category->publisherId, $category->name, true, array(
			"type" => "new",
			"streamsOnly" => true,
			"ignoreCache" => true
		));

		if (!empty($streams)) {
			return reset($streams);
		}

		$stream = Streams::create(null, $publisherId, "Streams/topic", array(), array(
			"publisherId" => $category->publisherId,
			"streamName" => $category->name,
			"type" => "new"
		));
		$stream->join(compact("userId"));
		return $stream;
	}
};