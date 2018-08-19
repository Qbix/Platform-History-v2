<?php

function Streams_2_0_05_Streams()
{
	$users = Users_user::select("*")->fetchAll(PDO::FETCH_ASSOC);
	echo "Creating streams...";
	$c = count($users);
	$i = 0;
	$streamName = 'Streams/image/album';
	$type = 'Streams/category';
	$arr = [];

	$sessions = Users_User::select("DISTINCT ss.publisherId, uu.sessionId", "uu")
		->join(Streams_Stream::table().' ss', array(
			'uu.id'=>'ss.publisherId'
		), "LEFT")
		->where(
			'ss.name LIKE "Streams/image/album"'
		)->fetchAll(PDO::FETCH_ASSOC);

	foreach ($sessions as $s) {
		if ($s['sessionId'] != '') {
			$arr[] = $s['publisherId'];
		}
	}
	foreach ($users as $r) {
		if (!in_array($r['id'], $arr) && $r['sessionId'] != '') {
			Streams::create($r['id'], $r['id'], $type, 
				array('name' => $streamName, 'title' => 'imageAlbum')
			);
		} else {
			Streams_Stream::update()->set(array(
				'type' => $type,
			))->where(array(
				'publisherId' => $r['id'],
				'name' => $streamName
			))->execute();
		}
		++$i;
		// echo "\033[100D";
		// echo "created $i of $c streams";
	}
	echo PHP_EOL;
}

Streams_2_0_05_Streams();