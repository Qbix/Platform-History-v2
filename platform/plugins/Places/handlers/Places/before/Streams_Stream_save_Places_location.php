<?php

function Places_before_Streams_Stream_save_Places_location($params)
{
	$stream = $params['stream'];
	$modifiedFields = $params['name'];
	if (!$stream->wasRetrieved()) {
		if (empty($stream->name) and empty($modifiedFields['name'])
		and $placeId = $stream->getAttribute('placeId')) {
			$stream->name = $modifiedFields['name'] = "Places/location/$placeId";
		}
	}
}