<?php

function Streams_1_0_2_Streams()
{
	$offset = 0;
	$i = 0;
	while (1) {
		$userIds = Users_User::select('id')
			->limit(100, $offset)
			->fetchAll(PDO::FETCH_COLUMN, 0);
		if (!$userIds) {
			break;
		}
		foreach ($userIds as $userId) {
			$stream = Streams::fetchOne($userId, $userId, 'Streams/user/gender');
			if (!$stream) {
				continue;
			}
			// Update all avatars corresponding to access rows for this stream
			$taintedAccess = Streams_Access::select()
				->where(array(
					'publisherId' => $stream->publisherId,
					'streamName' => $stream->name
				))->fetchDbRows();
			Streams_Avatar::updateAvatars($stream->publisherId, $taintedAccess, $stream, true);
			++$i;
			echo "\033[100D";
			echo "Updated $i avatars";
		}
		$offset += 100;
	};
	echo PHP_EOL;
}

Streams_1_0_2_Streams();