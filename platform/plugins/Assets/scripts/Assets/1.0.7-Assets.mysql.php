<?php

function Assets_1_0_7_Assets_mysql()
{
	$communityId = Users::communityId();
	$streamName = "Assets/NFTs";

	// create category
	$stream = Streams_Stream::fetch($communityId, $communityId, $streamName);
	if (!$stream) {
		$stream = Streams::create($communityId, $communityId, 'Streams/category', array(
			'name' => $streamName,
			'title' => "NFTs for ".$communityId,
			'readLevel' => 40,
			'writeLevel' => 23,
			'adminLevel' => 20
		));
	}
}

Assets_1_0_7_Assets_mysql();