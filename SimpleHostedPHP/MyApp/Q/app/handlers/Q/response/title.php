<?php

function Q_response_title()
{
	// The default title
	$title = Q_Config::get('Q', 'app', basename(APP_DIR));
	$action = Q_Dispatcher::uri()->action;
 	if ($action) {
		$title .= ": $action";
	}
	return $title;
}
