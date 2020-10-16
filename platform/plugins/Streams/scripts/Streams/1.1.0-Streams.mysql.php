<?php
	
function Streams_1_1_0_Streams()
{
	echo "Making templates with access for Streams/audio, Streams/video, Streams/pdf streams".PHP_EOL;

	$templates = array("Streams/audio/", "Streams/video/", "Streams/pdf/");
	$canManage = Q_Config::get("Streams", "canManage", array("Users/owners", "Users/admins"));

	// set access
	foreach ($templates as $template) {
		foreach ($canManage as $role) {
			$access = new Streams_Access();
			$access->publisherId = "";
			$access->streamName = $template;
			$access->ofContactLabel = $role;
			if (!$access->retrieve()) {
				$access->readLevel = $access->writeLevel = $access->adminLevel = 40;
				$access->save();
			}
		}
	}
	echo PHP_EOL;
}

Streams_1_1_0_Streams();