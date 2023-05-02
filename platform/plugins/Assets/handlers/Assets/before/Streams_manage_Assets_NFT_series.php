<?php
/**
 * Hook before remove Assets/NFT/series streams
 * @event Streams/close/Assets_NF_series {before}
 * @param {array} $params
 */
function Assets_before_Streams_manage_Assets_NFT_series($params)
{
	$stream = $params['stream'];
	if ($stream->getAttribute("frozen")) {
		$text = Q_Text::get("Assets/content");
		throw new Exception(Q::ifset($text, "errors", "CantManageFrozenSeries", "CantManageFrozenSeries"));
	}
}