<?php

function Websites_0_9_3_Streams_mysql()
{
	$results = Users_User::select()->fetchAll(PDO::FETCH_ASSOC);
	echo "Adding Websites/advert/categories streams...\n";
	$c = count($results);
	$i = 0;
	foreach ($results as $r) {
		$userId = $r['id'];
		Streams::create($userId, $userId, 'Streams/category', array(
			'name' => 'Websites/advert/campaigns'
		));
		++$i;
		echo "\033[100D";
		echo "Inserted $i of $c streams";
	}
	echo PHP_EOL;
}

Websites_0_9_3_Streams_mysql();