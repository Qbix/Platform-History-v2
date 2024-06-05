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

	$streams = $stream->related(null, false, array(
		'type' => 'Assets/NFT',
		'where' => array(
			'toStreamName' => 'Assets/NFT/series'
		),
		'streamsOnly' => true,
		'skipAccess' => true
	));
	foreach ($streams as $s) {
		$attributes = array();
		if ($s->getAttribute('frozen', null)) {
			throw new Assets_Exception_NFTSeriesFrozen();
		}
	}
}