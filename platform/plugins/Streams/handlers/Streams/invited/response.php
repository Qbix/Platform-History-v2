<?php
	
function Streams_invited_response()
{
	if (!($token = Q_Dispatcher::uri()->token)) {
		throw new Q_Exception_RequiredField(array(
			'field' => 'token'
		), 'token');
	}
	if (!($invite = Streams_Invite::fromToken($token))) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'invite',
			'criteria' => "token: $token"
		), 'token');
	}
	Users_User::fetch($invite->userId, true)->setVerified();
	Q_Response::redirect($invite->appUrl."?".http_build_query(array('Q.Streams.token' => $token), null, '&'));
}