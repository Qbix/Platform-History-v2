<?php
	
function Streams_1_1_3_Streams()
{
	echo "Adding access for Streams/calls/main".PHP_EOL;

	$adminLabels = Q_Config::get("Streams", "calls", "answered", array());
	foreach ($adminLabels as $adminLabel) {
		$access = new Streams_Access();
		$access->publisherId = "";
		$access->streamName = "Streams/calls/main";
		$access->ofContactLabel = $adminLabel;
		if (!$access->retrieve()) {
			$access->readLevel = 40;
			$access->writeLevel = 40;
			$access->adminLevel = 40;
			$access->save();
		}
	}

	echo "Adding Streams/calls/main for each community".PHP_EOL;
	$streamType = "Streams/calls";
	$streamName = "Streams/calls/main";
	$communities = Users_User::select()->where(array(
		"signedUpWith" => "none"
	))->fetchDbRows();
	foreach ($communities as $community) {
		if (!Users::isCommunityId($community->id)) {
			continue;
		}

		if (Streams::fetchOne($community->id, $community->id, $streamName)) {
			continue;
		}

		Streams::create($community->id, $community->id, $streamType, array(
			"name" => $streamName
		));
	}

	echo PHP_EOL;
}

Streams_1_1_3_Streams();