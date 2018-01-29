<?php

function Places_0_8_Streams_mysql()
{
	// symlink the icons folder
	Q_Utils::symlink(
		WEBSITES_PLUGIN_FILES_DIR.DS.'Websites'.DS.'icons',
		WEBSITES_PLUGIN_WEB_DIR.DS.'img'.DS.'icons',
		true
	);
}

Places_0_8_Streams_mysql();