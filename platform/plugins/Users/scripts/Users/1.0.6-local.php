<?php
	
function Users_1_0_6_local()
{
	// create templates dir
	$from = USERS_PLUGIN_VIEWS_DIR.DS.'Users'.DS.'templates';
	$dir = APP_WEB_DIR.DS.'Q'.DS.'views'.DS.'Users';
	$to = $dir.DS.'templates';
	if (!file_exists($to)) {
		if (!file_exists($dir)) {
			mkdir($dir, 0777, true);
		}
		Q_Utils::symlink($from, $to);
	}
}

Users_1_0_6_local();