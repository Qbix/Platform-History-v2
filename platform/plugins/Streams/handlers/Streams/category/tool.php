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
	
	$user = Users::loggedInUser(true);
	
	$userId = $user->id;
	
	// PK of stream to manage categories
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	
	$stream = Streams::get($userId, $publisherId, $name, null, true);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream', 
			'criteria' => "{publisherId: $publisherId, name: $name}"
		));
	}
	
	// activate tool frontend
	$default = array('publisherId' => $stream->publisherId, 'name' => $stream->name);
	$options = array_merge($default, $options);
	Q_Response::setToolOptions($options);
	
	// get the list of categories
	list($relations, $categories) = Streams::related($userId, $publisherId, $name, true);
	
	return Q::view("Streams/tool/category.php", compact('relations', 'categories', 'stream'));
}