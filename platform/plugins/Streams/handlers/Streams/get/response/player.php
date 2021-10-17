<?php

/**
 * Provide player content to view the stream content
 * Uses Streams/$type/get.php view and Streams::get to retrieve stream data
 *
 **/

function Streams_get_response_player () {
	
	$user = Users::loggedInUser();
	$userId = $user ? $user->id : 0;
	
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	
	if (substr($name, -1) === '/')
		throw new Q_Exception("Player cannot show multiple streams", @compact('publisherId', 'name'));

	/*
	 * Get shall return only streams which user is authorized to see.
	 */
	
	if (!($stream = Streams::get($userId, $publisherId, $name, null, true)))
		throw new Q_Exception_MissingRow(array('table' => 'stream', 'criteria' => @compact('publisherId', 'name')));
	
	// join the stream
	if ($userId !== 0 && $stream->testWriteLevel('join'))
		Streams_Stream::join($userId, $stream->publisherId, $stream->name);
	
	// Let's be nice to poor Windows users
	$type = join(DS, explode('/', $stream->type));
	
	return Q::view("Streams/$type/get.php", @compact('stream', 'userId'));
}