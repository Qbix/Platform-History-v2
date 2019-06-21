<?php
	
function Users_1_0_6_Users()
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

	// create ios token/cert.p8 and sandbox/bundle.pem
	$from = USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'ios';
	$dir = APP_DIR.DS.'local'.DS.'Users'.DS.'certs'.DS.Q::app();
	if (!file_exists($dir)) {
		mkdir($dir, 0755, true);
	}
	if (!file_exists($dir.DS.'sandbox')) {
		Q_Utils::symlink($from.DS.'sandbox', $dir.DS.'sandbox');
	}
	if (!file_exists($dir.DS.'token')) {
		Q_Utils::symlink($from.DS.'token', $dir.DS.'token');
	}
}

Users_1_0_6_Users();