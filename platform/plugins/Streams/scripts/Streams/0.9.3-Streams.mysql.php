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
		Streams_Stream::update()->set(array(
			'invitedCount' => intval($r['invitedCount']),
			'participatingCount' => intval($r['participatingCount']),
			'leftCount' => intval($r['leftCount'])
		))->where(array(
			'publisherId' => $r['publisherId'],
			'name' => $r['streamName']
		))->execute();
		++$i;
		echo "\033[100D";
		echo "Updated $i of $c streams";
	}
	echo PHP_EOL;
}

Streams_0_9_3_Streams();