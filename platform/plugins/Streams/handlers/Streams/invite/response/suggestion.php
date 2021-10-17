<?php

function Streams_invite_response_suggestion()
{
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$stream = Streams::fetchOne(null, $publisherId, $streamName, true);
	
	if (!empty($_REQUEST['token'])) {
		$roles = Q_Config::get('Streams', 'invites', 'canSetInviteTokens', array());
		if (!Users::roles(Users::communityId(), $roles)) {
			throw new Users_Exception_NotAuthorized();
		}
		if ($token = $_REQUEST['token']) {
			if ($invite = Streams_Invite::fromToken($token)) {
				throw new Q_Exception_AlreadyExists(array('source' => 'invite with this token'));
			}
		}
	} else {
		$token = Streams_Invite::generateToken();
	}
	
	$suggestion = @compact('token');
	$suggestion = Q_Utils::sign($suggestion);
	
	$data = array(
		'url' => Streams::inviteUrl($token),
		'invite' => @compact('token')
	);
	
	Q_Response::setSlot('stream', $stream->exportArray());
	Q_Response::setSlot('data', $data);
	return $suggestion;
}