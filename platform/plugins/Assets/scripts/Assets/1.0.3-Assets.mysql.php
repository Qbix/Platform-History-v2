<?php

function Assets_1_0_3()
{
	$communityId = Users::communityId();
	$streamName = "Assets/services";

	// create stream category
	$stream = Streams_Stream::fetch($communityId, $communityId, $streamName);
	if (!$stream) {
		$stream = Streams::create($communityId, $communityId, 'Streams/category', array(
			'name' => $streamName,
			'title' => "Assets Services for ".$communityId,
			'readLevel' => 40,
			'writeLevel' => 0,
			'adminLevel' => 0
		));
	}

	// set access
	foreach (array($streamName, "Assets/service/") as $template) {
		foreach (array("Users/owners", "Users/admins") as $role) {
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
}

Assets_1_0_3();