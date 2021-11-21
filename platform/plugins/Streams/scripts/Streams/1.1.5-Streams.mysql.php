<?php
	
function Streams_1_1_5_Streams()
{
	$offset = 0;
	$i = 0;
	echo "Updating Streams/user/profile streams".PHP_EOL;
	while (1) {
		$streams = Streams_Stream::select()
			->where(array(
				"type" => "Streams/user/profile",
				"closedTime" => null
			))
			->limit(100, $offset)
			->fetchDbRows();
		if (!$streams) {
			break;
		}
		foreach ($streams as $stream) {
			$stream->title = Streams::displayName($stream->publisherId, array('asUserId' => ''));
			$avatar = Streams_Avatar::fetch("", $stream->publisherId);
			$stream->icon = $avatar->icon;
			$stream->save();

			echo "\033[100D";
			echo "Updated $i streams";
		}
		$offset += 100;
	};
	echo PHP_EOL;
}

Streams_1_1_5_Streams();