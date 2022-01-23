<?php

function Assets_after_Streams_inviteAccept($params)
{
	// Make earning for invited user
	$invite = $params['invite'];
	$invitedUser = Users::fetch($invite->userId);
	$stream = $params['stream'];

	if (!$invitedUser) {
		return;
	}

	$credits = Q_Config::expect('Assets', 'credits', 'granted', 'acceptedInvite');

	Assets_Credits::grant($credits, 'InviteAcceptedBy', $invite->invitingUserId, array(
		'publisherId' => $stream->publisherId,
		'streamName' => $stream->name,
		'invitedUserName' => $invitedUser->displayName()
	));
}