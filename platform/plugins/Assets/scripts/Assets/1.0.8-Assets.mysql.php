<?php

function Assets_1_0_8_Assets_mysql()
{
	$communityId = Users::communityId();
	$streamNameTemplate = "Assets/NFT/contract/{{chainId}}";
	$chains = Assets_NFT::getChains();
	$text = Q_Text::get("Assets/content");
	
	// create global contracts streams for all chains in config
	foreach ($chains as $chain) {
		$streamName = Q::interpolate($streamNameTemplate, $chain);
		$stream = Streams_Stream::fetch($communityId, $communityId, $streamName);
		$title = Q::interpolate($text["NFT"]["contract"]["GlobalContractFor"], array("chainNetwork" => $chain["name"], "communityName" => Users::communityName()));
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
}

Assets_1_0_8_Assets_mysql();