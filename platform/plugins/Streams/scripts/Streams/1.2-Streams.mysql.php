<?php
	
function Streams_1_2_Streams()
{
	echo "Adding access for Streams/topic and Streams/course stream type".PHP_EOL;

	$streamTypes = array("Streams/topic", "Streams/course");
	foreach ($streamTypes as $streamType) {
		$adminLabels = Streams_Stream::getConfigField($streamType, 'admins', array());
		foreach ($adminLabels as $adminLabel) {
			$access = new Streams_Access();
			$access->publisherId = "";
			$access->streamName = $streamType."*";
			$access->ofContactLabel = $adminLabel;
			$access->readLevel = 40;
			$access->writeLevel = 40;
			$access->adminLevel = 40;
			$access->save(true);
		}
	}

	echo PHP_EOL;
}

Streams_1_2_Streams();