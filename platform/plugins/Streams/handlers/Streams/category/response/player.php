<?php

/**
 * Provide player content to view the members of category listing
 * Uses Streams/$type/category.php view (Streams/$streamType/category/get.php can be used for viewing the category
 * stream itself if type of category is $streamType/category)
 * and Streams::related to retrieve streams data
 *
 **/

function Streams_category_response_player () {
	
	$user = Users::loggedInUser();
	$userId = $user ? $user->id : 0;
	
	// These are PK of the category!
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	
	// need to know publisher and type of the streams to list
	$streamType = Streams::requestedType();
	if ($streamType) $prefix = "$streamType/";
	$stream_publisherId = Q::expect('Streams', $streamType, 'publisher');
	
	if (substr($name, -1) === '/')
		throw new Q_Exception("Player cannot show listing for multiple categories", @compact('publisherId', 'name'));
	
	/*
	 * Get shall return only streams which user is authorized to see.
	 */

	$categories = Streams::fetch($userId, $publisherId, $name);
	if (empty($categories))
		throw new Q_Exception_MissingRow(array('table' => 'stream', 'criteria' => @compact('publisherId', 'name')));
	$category = reset($categories);

	// Are you authorized to see category content?
	if (!$category->testReadLevel('content'))
			throw new Users_Exception_NotAuthorized();

	// get all the streams which are members of this category
	// as Streams::get verifies access rights, it's safe to show all streams' content
	list($relations, $streams) = Streams::related(
		$userId, 
		$publisherId, 
		$name, 
		true,
		array('prefix' => $prefix, 'skipAccess' => true)
	);

	Q::view("Stream/$type/category.php", @compact('relations', 'streams', 'userId'));
}