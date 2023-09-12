<?php
	
function Users_session_post()
{
	Users_Session::createSessionFromCapability($_REQUEST);

	Q_Response::setSlot('result', 'success');
}