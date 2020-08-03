<?php

function Assets_after_Streams_inviteAccept($params)
{
	// Make earning for invited user
	$participant = $params['participant'];
	$invite = $params['invite'];

	if (!$invite->userId || $participant->state != 'participating') {
		return;
	}

	$invitedUser = Users::fetch($invite->userId);
	if (!$invitedUser) {
		return;
	}

	$credits = Q_Config::expect('Assets', 'credits', 'granted', 'acceptedInvite');

	Assets_Credits::grant($credits, 'InviteAcceptedBy', $invite->invitingUserId, array(
		'publisherId' => $participant->publisherId,
		'streamName' => $participant->streamName,
		'invitedUserName' => $invitedUser->displayName()
	));
}