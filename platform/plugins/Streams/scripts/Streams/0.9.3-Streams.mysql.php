<?php

function Streams_0_9_3_Streams()
{
	$results = Streams_Participant::select("publisherId, streamName, COUNT(IF(state='invited', 1, NULL)) invitedCount, COUNT(IF(state='participating', 1, NULL)) participatingCount, COUNT(IF(state='left', 1, NULL)) leftCount")
		->groupBy('publisherId, streamName')
		->fetchAll(PDO::FETCH_ASSOC);
	echo "Updating streams...";
	$c = count($results);
	$i = 0;
	foreach ($results as $r) {
		$counts = array(
			intval($r['invitedCount']), 
			intval($r['participatingCount']), 
			intval($r['leftCount'])
		);
		Streams_Stream::update()->set(array(
			'participantCounts' => json_encode($counts)
		))->where(array(
			'publisherId' => $r['publisherId'],
			'name' => $r['streamName']
		))->execute();
		++$i;
		echo "\033[100D";
		echo "Updated $i of $c streams";
	}
	echo "\n";
}

Streams_0_9_3_Streams();