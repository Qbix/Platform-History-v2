<?php

/**
 * This tool generates a category selector.
 *
 * @param array $options
 *  An associative array of parameters, containing:
 *  "publisherId" => Optional. publisherId of the stream to present. If "stream" parameter is empty
 *    defaults to Streams::requestedPublisherId()
 *  "name" => Optional. the name of the stream to present. If "stream" parameter is empty
 *    defaults to Streams::requestedName()
 *  "stream" => Optional. Object. The stream objects to show categories.
 */

function Streams_category_tool($options) {
	extract($options);
	$userId = Users::loggedInUser(true)->id;
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	$stream = Streams::fetchOne($userId, $publisherId, $name, true);
	$options = array_merge(array(
		'publisherId' => $stream->publisherId, 
		'name' => $stream->name
	), $options);
	Q_Response::setToolOptions($options);
	return Q::tool('Streams/related', array_merge(array(
		'publisherId' => Users::communityId(),
		'streamName' => 'Streams/category/admins',
		'relationType' => ''
	), $options));
}