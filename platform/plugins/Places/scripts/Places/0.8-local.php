<?php

function Places_0_8_local()
{
	// symlink the icons folder
	Q_Utils::symlink(
		PLACES_PLUGIN_FILES_DIR.DS.'Places'.DS.'icons',
		PLACES_PLUGIN_WEB_DIR.DS.'img'.DS.'icons',
		true
	);
}

Places_0_8_local();