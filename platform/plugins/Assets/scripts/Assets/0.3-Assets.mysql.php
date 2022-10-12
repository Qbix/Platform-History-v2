<?php

function Assets_0_3()
{
	$app = Q::app();
	$streamName = "Assets/plans";

	// if stream already exist - exit
	if (!Streams_Stream::fetch($app, $app, $streamName)) {
		Streams::create($app, $app, 'Streams/category',
			array('name' => $streamName)
		);
	}

	$adminLabels = array("Users/owners", "Users/admins", "Assets/admins");
	foreach ($adminLabels as $adminLabel) {
		$access = new Streams_Access();
		$access->publisherId = "";
		$access->streamName = $streamName;
		$access->ofContactLabel = $adminLabel;
		if ($access->retrieve()) {
			continue;
		}
		$access->readLevel = 40;
		$access->writeLevel = 40;
		$access->adminLevel = 40;
		$access->save();
	}
}

Assets_0_3();