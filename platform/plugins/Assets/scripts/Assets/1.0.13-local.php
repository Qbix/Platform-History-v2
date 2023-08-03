<?php
	
function Assets_1_0_13_local()
{
	Q_Utils::symlink(
		ASSETS_PLUGIN_FILES_DIR.DS.'Assets'.DS.'icons',
		ASSETS_PLUGIN_WEB_DIR.DS.'img'.DS.'icons',
		true
	);
}

Assets_1_0_13_local();