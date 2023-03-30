<?php
	
function Streams_0_1_7_local()
{
	$from = STREAMS_PLUGIN_VIEWS_DIR.DS.'Streams'.DS.'templates';
	$dir = APP_WEB_DIR.DS.'Q'.DS.'views'.DS.'Streams';
	$to = $dir.DS.'templates';
	if (!file_exists($to)) {
		if (!file_exists($dir)) {
			mkdir($dir, 0777, true);
		}
		Q_Utils::symlink($from, $to);
	}

	// symlink the icons folder
	/*Q_Utils::symlink(
		STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons',
		STREAMS_PLUGIN_WEB_DIR.DS.'img'.DS.'icons',
		true
	);*/
}

Streams_0_1_7_local();