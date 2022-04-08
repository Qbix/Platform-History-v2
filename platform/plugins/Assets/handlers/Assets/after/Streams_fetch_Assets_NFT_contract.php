<?php
function Assets_after_Streams_fetch_Assets_NFT_contract ($params) {
	$streams = $params['streams'];
	$chains = Assets_NFT::getChains();

	foreach ($streams as $streamName => $stream) {
		if (!$stream) {
			continue;
		}

		if ($stream->type != "Assets/NFT/contract" || $stream->publisherId != Users::communityId()) {
			continue;
		}

		$parts = explode("/", $stream->name);
		$chainId = end($parts);
		$streams[$streamName]->setAttribute("contract", Q::ifset($chains, $chainId, "contract", null));
		$streams[$streamName]->setAttribute("factory", Q::ifset($chains, $chainId, "factory", null));
		$streams[$streamName]->save();
	}

}