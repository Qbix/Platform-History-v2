<?php

function Websites_0_9_3_Streams_mysql()
{
	$results = Users_User::select()->fetchAll(PDO::FETCH_ASSOC);
	echo "Adding Websites/advert/xxx streams...\n";
	$c = count($results);
	$i = 0;
	foreach ($results as $r) {
		$userId = $r['id'];
		$suffixes = array('units', 'placements', 'creatives', 'campaigns');
		foreach ($suffixes as $suffix) {
			Streams::create($userId, $userId, 'Streams/category', array(
				'name' => "Websites/advert/$suffix"
			));
		}
		++$i;
		echo "\033[100D";
		echo "Added streams for $i of $c users";
	}
	echo PHP_EOL;
}

Websites_0_9_3_Streams_mysql();