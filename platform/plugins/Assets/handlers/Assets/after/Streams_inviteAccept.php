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

	$credits = Q_Config::expect('Assets', 'credits', 'earn', 'acceptedInvite');

	$text = Q_Text::get('Assets/content', array('language' => Users::getLanguage($invitedUser->id)));
	$text = Q::interpolate($text['credits']['InviteAcceptedBy'], array($invitedUser->displayName()));

	Assets_Credits::earn($credits, $invite->invitingUserId, array(
		'reason' => $text,
		'publisherId' => $participant->publisherId,
		'streamName' => $participant->streamName
	));
}