<?php

function Streams_0_8_7_Streams_mysql()
{
	$app = Q_Config::expect('Q', 'app');
	$communityId = Users::communityId();
	$user = Users_User::fetch($communityId, true); // make sure it is there
	
	$result = Users_User::select('COUNT(1)')
		->fetchAll(PDO::FETCH_NUM);
	$c = $result[0][0];
	echo "Inserting streams for users...";
	$offset = 0;
	$batch = 1000;
	for ($i=1; true; ++$i) {
		$users = Users_User::select('*')
			->orderBy('id')
			->limit($batch, $offset)
			->fetchDbRows();
		if (!$users) {
			break;
		}
		$offset += $batch;
		foreach ($users as $user) {
			$simulated = array(
				'row' => $user,
				'inserted' => true,
				'modifiedFields' => $user->fields,
				'query' => null
			);
			Q::event('Db/Row/Users_User/saveExecute', $simulated, 'after');
			echo "\033[100D";
			echo "Inserted streams for $i of $c users";
		}
	}
	echo PHP_EOL;
	
	$stream = array(
		'publisherId' => '', 
		'name' => "Streams/images/",
		'type' => 'Streams/template', 
		'title' => 'Image Gallery',
		'icon' => 'default',
		'content' => '',
		'attributes' => null,
		'readLevel' => Streams::$READ_LEVEL['messages'], 
		'writeLevel' => Streams::$WRITE_LEVEL['close'], 
		'adminLevel' => Streams::$ADMIN_LEVEL['invite']
	);
	$access = array(
		'publisherId' => '', 
		'streamName' => "Streams/images/",
		'ofUserId' => '',
		'grantedByUserId' => null,
		'ofContactLabel' => "$app/admins",
		'readLevel' => Streams::$READ_LEVEL['messages'], 
		'writeLevel' => Streams::$WRITE_LEVEL['close'], 
		'adminLevel' => Streams::$ADMIN_LEVEL['invite']
	);
	Streams_Stream::insert($stream)->execute();
	Streams_Access::insert($access)->execute();
	$stream['name'] = $access['streamName'] = 'Streams/image/';
	$stream['icon'] = 'Streams/image';
	$stream['title'] = 'Untitled Image';
	Streams_Stream::insert($stream)->execute();
	Streams_Access::insert($access)->execute();
	$stream['name'] = $access['streamName'] = 'Streams/file/';
	$stream['icon'] = 'files/_blank';
	$stream['title'] = 'Untitled File';
	Streams_Stream::insert($stream)->execute();
	Streams_Access::insert($access)->execute();
}

Streams_0_8_7_Streams_mysql();