<?php

/**
 * Used to get list of streams
 *
 * @param string $params 
 *   publisher id and stream name of existing stream shall be supplied
 * @return {void}
 *   array of streams indexed by names
 */

function Streams_publisher_get($params) {
	// only logged in user can get stream
	$user = Users::loggedInUser(true);
	
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	$options = array_merge($_REQUEST, $params);
	
	return Streams::get($user->id, $publisherId, $name, $options);
}