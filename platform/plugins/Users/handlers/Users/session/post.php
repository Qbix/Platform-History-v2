<?php
	
function Users_session_post()
{
	Users_Session::createSessionFromPayload($_REQUEST);

	Q_Response::setSlot('result', 'success');
}