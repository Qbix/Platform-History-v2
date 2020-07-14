<?php
/**
 * Hook to create Streams/interest when new Assets/service created.
 * @event Streams/create/Assets_service {after}
 * @param {array} $params
 * @param {Streams_Stream} $params.stream
 */
function Assets_after_Streams_create_Assets_service($params)
{
	Streams::getInterest('Service: '.$params['stream']->title);
}