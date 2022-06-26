<?php

function Streams_access_response_data()
{
	$user 		 = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId(true);
	$streamName  = Streams::requestedName(true);
	$stream      = Streams_Stream::fetch($user->id, $publisherId, $streamName);

	if (!$stream->testAdminLevel('own')) {
		throw new Users_Exception_NotAuthorized();
	}

	return array('access' => Q::ifset(Streams::$cache, 'access', null));
}