<?php

function Streams_1_1_6_Streams()
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
        $streamName = 'Streams/user/profile';
        $toInsert = array();
        $publisherIds = Streams_Stream::select('publisherId')->where(array(
            'publisherId' => $userIds,
            'name' => $streamName
        ))->fetchAll(PDO::FETCH_COLUMN, 0);
		foreach (array_diff($userIds, $publisherIds) as $userId) {
            Streams::create($userId, $userId, 'Streams/user/profile', array(
                'name' => $streamName,
                'title' => Streams::displayName(
                    $userId, 
                    array('asUserId' => '', 'short' => false)
                )
            ));
            echo "\033[100D";
            echo "Created $i profiles";
		}
		$offset += 100;
	};
	echo PHP_EOL;
}

Streams_1_1_6_Streams();