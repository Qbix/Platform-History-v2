<?php
	
function Streams_1_2_2_Streams()
{
	echo "Adding access for Assets/fundraise stream type".PHP_EOL;
	$streamType = "Assets/fundraise";
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
	echo PHP_EOL;
}

Streams_1_2_2_Streams();