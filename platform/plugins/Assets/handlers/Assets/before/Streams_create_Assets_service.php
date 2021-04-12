<?php
/**
 * Hook to create Streams/interest when new Assets/service created.
 * @event Streams/create/Assets_service {after}
 * @param {array} $params
 * @param {Streams_Stream} $params.stream
 */
function Assets_before_Streams_create_Assets_service($params, $stream)
{
	$interest = Streams::getInterest($stream->title);
	$stream->icon = $interest->icon;
}