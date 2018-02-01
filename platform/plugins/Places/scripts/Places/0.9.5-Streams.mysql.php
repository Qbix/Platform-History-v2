<?php

function Places_0_9_5_Streams()
{
	$app = Q::app();
	foreach (array('Places/location', 'Places/area', 'Places/floor', 'Places/column') as $type) {
		$defaults =  Streams_Stream::getConfigField($type, 'defaults');
		$name = "$type/";
		$s = new Streams_Stream(array(
			'publisherId' => '',
			'name' => $name,
			'icon' => $defaults['icon'],
			'title' => $defaults['title'],
			'type' => 'Streams/template'
		));
		$s->save();
		$a = new Streams_Access(array(
			'publisherId' => '',
			'streamName' => $name,
			'ofUserId' => '',
			'ofContactLabel' => 'Places/admins',
			'readLevel' => Streams::$READ_LEVEL['max'],
			'writeLevel' => Streams::$WRITE_LEVEL['max'],
			'adminLevel' => Streams::$ADMIN_LEVEL['own']
		));
		$a->save();
		if ($type !== 'Places/location') {
			$r = new Streams_RelatedTo(array(
				'toPublisherId' => '',
				'toStreamName' => 'Places/location/',
				'fromPublisherId' => '',
				'fromStreamName' => $name,
				'type' => $type . 's',
				'weight' => 1
			));
			$r->save();
		}
	}
	echo "Inserted Templates for location, area, floor and column". PHP_EOL;
}

Places_0_9_5_Streams();