<?php
	
function Users_0_8_local()
{
	// symlink the icons folder
	Q_Utils::symlink(
		USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'icons',
		USERS_PLUGIN_WEB_DIR.DS.'img'.DS.'icons',
		true
	);
}

Users_0_8_local();