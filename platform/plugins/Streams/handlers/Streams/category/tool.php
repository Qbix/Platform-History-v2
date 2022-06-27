<?php

/**
 * This tool generates a category selector.
 *
 * @param {array} $options An associative array of parameters, containing:
 * @param {string} [$options.publisherId=Streams::requestedPublisherId()] The publisherId of the stream to present. If "stream" parameter is empty
 * @param {string} [$options.streamName=Streams::requestedName()] The streamName of the stream to present. If "stream" parameter is empty
 * @param {string} [options.relationType=null] Filter the relation type.
 */

function Streams_category_tool($options) {
	extract($options);
	if (!$publisherId) {
		$options['publisherId'] = $publisherId = Streams::requestedPublisherId(true);
	}
	if (!$streamName) {
		$options['streamName'] = $streamName = Streams::requestedName(true);
	}
	Q_Response::setToolOptions($options);
	$stream = Streams_Stream::fetch(null, $publisherId, $streamName, true);
	$userId = Users::loggedInUser(true)->id;
	return Q::tool('Streams/related', $options);
}