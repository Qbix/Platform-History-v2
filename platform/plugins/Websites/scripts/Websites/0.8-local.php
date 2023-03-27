<?php

function Websites_0_8_local()
{
	if (!file_exists(USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'icons'.DS.'Websites')) {
		Q_Utils::symlink(
			WEBSITES_PLUGIN_FILES_DIR.DS.'Websites'.DS.'icons'.DS.'labels'.DS.'Websites',
			USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'icons'.DS.'labels'.DS.'Websites'
		);
	}
}

Websites_0_8_local();