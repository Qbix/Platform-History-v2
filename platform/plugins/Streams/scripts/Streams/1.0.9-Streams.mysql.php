<?php
	
function Streams_0_1_9_Streams()
{
	$offset = 0;
	$i = 0;
	echo "Creating Streams/mentioned streams".PHP_EOL;
	while (1) {
		$users = Users_User::select()
			->limit(100, $offset)
			->fetchDbRows();
		if (!$users) {
			break;
		}
		foreach ($users as $user) {
			if (Users::isCommunityId($user->id)) {
				continue;
			}

			$stream = Streams_Stream::fetch($user->id, $user->id, 'Streams/mentioned');
			if ($stream) {
				continue;
			}
			Streams::create($user->id, $user->id, 'Streams/mentioned', array(
				'name' => "Streams/mentioned",
				'skipAccess' => true
			))->subscribe(array('userId' => $user->id));
			++$i;
			echo "\033[100D";
			echo "Created $i streams";
		}
		$offset += 100;
	};
	echo PHP_EOL;
}

Streams_0_1_9_Streams();