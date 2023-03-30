<?php

function Streams_0_8_1_local()
{
    // symlink the labels folder
	Q_Utils::symlink(
		STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons'.DS.'labels'.DS.'Streams',
		USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'icons'.DS.'labels'.DS.'Streams',
		true
	);
	
	// symlink the icons folder
	Q_Utils::symlink(
		STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons',
		STREAMS_PLUGIN_WEB_DIR.DS.'img'.DS.'icons',
		true
	);
}

Streams_0_8_1_local();
