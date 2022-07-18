<?php
	
function Streams_invited_response()
{
	if (!($token = Q_Dispatcher::uri()->token)) {
		throw new Q_Exception_RequiredField(array(
			'field' => 'token'
		), 'token');
	}
	$invite = Streams_Invite::fromToken($token, true);
	if ($invite->userId) {
		Users_User::fetch($invite->userId, true)->setVerified();
	}
	$querystring = http_build_query(array('Q.Streams.token' => $token, "invitingUserId" => $invite->invitingUserId), '', '&');
	if (!Q_Valid::url($invite->appUrl)) {
		$stream = Streams_Stream::fetch($invite->publisherId, $invite->publisherId, $invite->streamName, true);
		$invite->appUrl = $stream->url();
	}
	Q_Response::redirect($invite->appUrl.'?'.$querystring);
}