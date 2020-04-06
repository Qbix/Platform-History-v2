<?php

function Streams_invite_response_suggestion()
{
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$stream = Streams::fetchOne(null, $publisherId, $streamName, true);
	
	$token = Streams_Invite::generateToken();
	
	$suggestion = compact('token');
	$suggestion = Q_Utils::sign($suggestion);
	
	$data = array(
		'url' => Streams::inviteUrl($token),
		'invite' => array(
			'token'
			=> $token
		)
	);
	
	Q_Response::setSlot('stream', $stream->exportArray());
	Q_Response::setSlot('data', $data);
	return $suggestion;
}