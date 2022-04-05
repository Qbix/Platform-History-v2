<?php
$communityId = Users::communityId();
$streamNameTemplate = "Assets/NFT/contract/{{chainId}}";
$chains = Assets_NFT::getChains();
$text = Q_Text::get("Assets/content");

foreach ($chains as $chain) {
	$streamName = Q::interpolate($streamNameTemplate, $chain);
	$stream = Streams::fetchOne($communityId, $communityId, $streamName);
	$title = Q::interpolate($text["NFT"]["contract"]["GlobalContractFor"], array("chainNetwork" => $chain["name"]));
	if (!$stream) {
		$stream = Streams::create($communityId, $communityId, 'Assets/NFT/contract', array(
			'name' => $streamName,
			'title' => $title,
			'readLevel' => 40,
			'writeLevel' => 23,
			'adminLevel' => 20
		));
	}
}

$offset = 0;
$i = 0;
$categoryStreamName = "Assets/NFT/contracts";
$adminLabels = Q_Config::get("Users", "communities", "admins", null);
// create access row
foreach ($adminLabels as $adminLabel) {
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

echo "Creating $categoryStreamName categories".PHP_EOL;
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

		$stream = Streams::fetchOne($user->id, $user->id, $categoryStreamName);
		if ($stream) {
			continue;
		}
		Streams::create($user->id, $user->id, "Streams/category", array(
			'name' => $categoryStreamName,
			'skipAccess' => true
		));
		++$i;
		echo "\033[100D";
		echo "Created $i streams";
	}
	$offset += 100;
};
echo PHP_EOL;