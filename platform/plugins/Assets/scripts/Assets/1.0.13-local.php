<?php
	
function Assets_1_0_13_local()
{
	Q_Utils::symlink(
		PLACES_PLUGIN_FILES_DIR.DS.'Places'.DS.'icons',
		PLACES_PLUGIN_WEB_DIR.DS.'img'.DS.'icons',
		true
	);
}

Assets_1_0_13_local();