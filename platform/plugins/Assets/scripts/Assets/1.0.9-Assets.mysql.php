<?php
$offset = 0;
$i = 0;
$categoryStreamNames = array("Assets/NFT/series", "Assets/NFT/collections");
$adminLabels = Q_Config::get("Users", "communities", "admins", null);
// create access row
foreach ($adminLabels as $adminLabel) {
	foreach ($categoryStreamNames as $categoryStreamName) {
		$access = new Streams_Access();
		$access->publisherId = "";
		$access->streamName = $categoryStreamName;
		$access->ofContactLabel = $adminLabel;
		if (!$access->retrieve()) {
			$access->readLevel = 40;
			$access->writeLevel = 40;
			$access->adminLevel = 40;
			$access->save();
		}
	}
}

echo "Creating ".implode(",", $categoryStreamNames)." categories for each users".PHP_EOL;
while (1) {
	$users = Users_User::select()
		->limit(100, $offset)
		->fetchDbRows();
	if (!$users) {
		break;
	}
	foreach ($users as $user) {
		foreach ($categoryStreamNames as $categoryStreamName) {
			if (Users::isCommunityId($user->id) && $categoryStreamName=="Assets/NFT/series") {
				continue;
			}

			$stream = Streams_Stream::fetch($user->id, $user->id, $categoryStreamName);
			if ($stream) {
				continue;
			}
			Streams::create($user->id, $user->id, "Streams/category", array(
				"name" => $categoryStreamName,
				"skipAccess" => true
			));
		}

		++$i;
		echo "\033[100D";
		echo "Created $i streams";
	}
	$offset += 100;
};
echo PHP_EOL;