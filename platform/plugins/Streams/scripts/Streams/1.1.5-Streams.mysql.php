<?php
function Streams_1_1_5_Streams () {
	$offset = 0;
	$i = 0;
	$streamName = "Streams/user/profile";

	echo "Updating $streamName streams".PHP_EOL;
	while (1) {
		$users = Users_User::select()
			->where(array("signedUpWith != " => "none"))
			->limit(100, $offset)
			->fetchDbRows();
		if (empty($users)) {
			break;
		}
		foreach ($users as $i => $user) {
			$title = Streams::displayName($user->id, array('asUserId' => ''));
			$avatar = Streams_Avatar::fetch("", $user->id);
			$icon = $avatar->icon;

			$stream = Streams::fetchOne($user->id, $user->id, $streamName);
			if ($stream) {
				$stream->title = $title;
				$stream->icon = $icon;
				$stream->save();
			} else {
				Streams::create($user->id, $user->id, $streamName, array(
					"title" => $title,
					"icon" => $icon,
					"name" => $streamName
				));
			}

			echo "\033[100D";
			echo "Updated $i users";
		}
		$offset += 100;
	};
	echo PHP_EOL;
}

Streams_1_1_5_Streams();