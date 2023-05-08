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

	$relatedTo = Streams_RelatedTo::select('ss.*', 'srt')
		->join(Streams_Stream::table().' ss', array(
			'srt.toPublisherId' => 'ss.publisherId',
			'srt.toStreamName' => 'ss.name'
		))->where(array(
			"srt.fromPublisherId" => $stream->publisherId,
			"srt.fromStreamName" => $stream->name,
			"srt.type" => "Assets/NFT",
			'ss.type' => 'Assets/NFT/series'
		))->fetchDbRows();

	foreach ($relatedTo as $rt) {
		$attributes = array();
		try {
			$attributes = Q::json_decode($rt->attributes, true);
		} catch (Exception $e) {
		}

		if (Q::ifset($attributes, "frozen", null)) {
			throw new Assets_Exception_NFTSeriesFrozen();
		}
	}
}