<?php
	
function Streams_after_Users_setLoggedInUser($params)
{
	// if this the first time the user has ever logged in...
	$user = $params['user'];
	if ($user->sessionCount != 1) {
		return;
	}
	
	// subscribe to main community announcements
	$communityId = Users::communityId();
	$stream = Streams::fetchOne($user->id, $communityId, 'Streams/experience/main');
	if ($stream and !$stream->subscription($user->id)) {
		$stream->subscribe();
	}
}