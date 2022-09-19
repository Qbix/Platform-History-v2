<?php
	
function Assets_1_0_11_Assets()
{
	// create templates dir
	$from = ASSETS_PLUGIN_VIEWS_DIR.DS.'Assets'.DS.'templates';
	$dir = APP_WEB_DIR.DS.'Q'.DS.'views'.DS.'Assets';
	$to = $dir.DS.'templates';
	if (!file_exists($to)) {
		if (!file_exists($dir)) {
			mkdir($dir, 0777, true);
		}
		Q_Utils::symlink($from, $to);
	}
}

Assets_1_0_11_Assets();