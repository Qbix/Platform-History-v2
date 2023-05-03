<?php
/**
 * Hook before remove Assets/NFT streams
 * @event Streams/close/Assets_NFT {before}
 * @param {array} $params
 */
function Assets_before_Streams_manage_Assets_NFT($params)
{
	$stream = $params['stream'];

	if (empty($stream->name)) {
		return;
	}

	$categories = Streams::related(
		$stream->publisherId,
		$stream->publisherId,
		$stream->name,
		false,
		array('streamsOnly')
	);
	$category = reset($categories);
	if ($category->getAttribute('frozen', false)) {
		throw new Assets_Exception_NFTSeriesFrozen();
	}
}