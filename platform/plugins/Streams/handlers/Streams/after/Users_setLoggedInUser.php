<?php
	
function Streams_after_Users_setLoggedInUser($params)
{
	$user = $params['user'];
	if ($token = Q::ifset($_SESSION, 'Streams', 'invite', 'token', null)) {
		$invite = Streams_Invite::fromToken($token);
		// accept invite and autosubscribe if first time and possible
		if ($invite and $invite->accept(array(
			'access' => true,
			'subscribe' => true
		))) {
			unset($_SESSION['Streams']['invite']['token']);
		}
	}

	// if this the first time the user has ever logged in...
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