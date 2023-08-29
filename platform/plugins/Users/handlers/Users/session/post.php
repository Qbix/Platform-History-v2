<?php
	
function Users_session_post()
{
	Users_Session::createAndGenerateRedirectUrl();

	Q_Response::setSlot('result', 'success');
}