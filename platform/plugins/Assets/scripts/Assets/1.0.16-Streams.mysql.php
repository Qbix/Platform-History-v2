<?php


function Streams_1_0_16()
{
	$streamType = "Assets/plan";
	$admins = Q_Config::get("Streams", "types", $streamType, "canCreate", []);
	foreach ($admins as $admin) {
		$access = new Streams_Access();
		$access->publisherId = "";
		$access->streamName = $streamType."*";
		$access->ofContactLabel = $admin;
		if (!$access->retrieve()) {
			$access->readLevel = $access->writeLevel = $access->adminLevel = 40;
			$access->save();
		}
	}
}

Streams_1_0_16();