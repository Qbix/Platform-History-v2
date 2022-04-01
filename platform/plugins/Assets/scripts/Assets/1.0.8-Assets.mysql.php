<?php
$communityId = Users::communityId();
$streamNameTemplate = "Assets/NFT/contract/{{chainId}}";
$chains = Assets_NFT::getChains();

foreach ($chains as $chain) {
	$streamName = Q::interpolate($streamNameTemplate, $chain);
	$stream = Streams::fetchOne($communityId, $communityId, $streamName);
	if (!$stream) {
		$stream = Streams::create($communityId, $communityId, 'Assets/NFT/contract', array(
			'name' => $streamName,
			'title' => "Global Assets/NFT/contract",
			'readLevel' => 40,
			'writeLevel' => 10,
			'adminLevel' => 20
		));
	}
}

$offset = 0;
$i = 0;
echo "Creating Assets/NFT/contracts categories".PHP_EOL;
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

		$stream = Streams::fetchOne($user->id, $user->id, "Assets/NFT/contracts");
		if ($stream) {
			continue;
		}
		Streams::create($user->id, $user->id, "Streams/category", array(
			'name' => "Assets/NFT/contracts",
			'skipAccess' => true
		));
		++$i;
		echo "\033[100D";
		echo "Created $i streams";
	}
	$offset += 100;
};
echo PHP_EOL;