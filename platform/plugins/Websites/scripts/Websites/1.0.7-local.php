<?php

function Websites_1_0_7_local()
{
	// symlink the icons folder
	Q_Utils::symlink(
		WEBSITES_PLUGIN_FILES_DIR.DS.'Websites'.DS.'icons',
		WEBSITES_PLUGIN_WEB_DIR.DS.'img'.DS.'icons',
		true
	);
}

Websites_1_0_7_local();