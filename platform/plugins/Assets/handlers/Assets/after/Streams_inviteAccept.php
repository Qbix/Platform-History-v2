<?php

function Assets_after_Streams_inviteAccept($params)
{
	// Make earning for invited user
	$participant = $params['participant'];
	$invite = $params['invite'];

	if (!$invite->userId || $participant->state != 'participating') {
		return;
	}

	//$invitedUser = Users::fetch($invite->invitingUserId);

	$credits = Q_Config::expect('Assets', 'credits', 'earn', 'acceptedInvite');

	Assets_Credits::earn($credits, $invite->userId, array(
		'reason' => "Invite accepted by ".$invite->invitingUserId,
		'publisherId' => $participant->publisherId,
		'streamName' => $participant->streamName
	));
}