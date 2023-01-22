<?php
	
function Streams_1_1_8_Streams()
{
	echo "Adding access for Streams/answer stream type".PHP_EOL;

	$streamType = "Streams/answer";
	$adminLabels = Streams_Stream::getConfigField($streamType, 'admins', array());
	foreach ($adminLabels as $adminLabel) {
		$access = new Streams_Access();
		$access->publisherId = "";
		$access->streamName = $streamType."*";
		$access->ofContactLabel = $adminLabel;
		if (!$access->retrieve()) {
			$access->readLevel = 40;
			$access->writeLevel = 40;
			$access->adminLevel = 40;
			$access->save();
		}
	}

	echo PHP_EOL;
}

Streams_1_1_8_Streams();