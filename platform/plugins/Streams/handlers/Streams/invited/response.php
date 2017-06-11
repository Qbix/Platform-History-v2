<?php
	
function Streams_invited_response()
{
	if (!($token = Q_Dispatcher::uri()->token)) {
		throw new Q_Exception_RequiredField(array(
			'field' => 'token'
		), 'token');
	}
	$invite = Streams_Invite::fromToken($token, true);
	Users_User::fetch($invite->userId, true)->setVerified();
	$querystring = http_build_query(array('Q.Streams.token' => $token), null, '&');
	Q_Response::redirect($invite->appUrl.'?'.$querystring);
}