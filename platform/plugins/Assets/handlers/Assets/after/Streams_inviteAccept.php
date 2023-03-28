<?php

function Assets_after_Streams_inviteAccept($params)
{
	// Make earning for invited user
	$invite = $params['invite'];
	$invitedUserId = $params['userId'];
	$invitedUser = Users::fetch($invitedUserId);
	$stream = $params['stream'];

	if (!$invitedUser || $invitedUser->sessionCount > 0) {
		return; // only get credit for inviting new users
	}

	$credits = Q_Config::get('Assets', 'credits', 'grant', 'Users/newUserAcceptedYourInvite', 0);
	if ($credits > 0) {
		Assets_Credits::grant($credits, 'InviteAcceptedBy', $invite->invitingUserId, array(
			'publisherId' => $stream->publisherId,
			'streamName' => $stream->name,
			'invitedUserName' => $invitedUser->displayName()
		));
	}
}