<?php

function Broadcast_welcome_response_content($params)
{
	// Do controller stuff here. Prepare variables
	Q_Response::addScript('plugins/Broadcast/js/Broadcast.js');
	return Q::view('Broadcast/content/welcome.php');
}

