<?php

function Streams_audio_post($params)
{
	$streamParams = Q::ifset($params, 'streamParams', array());
	$relatedParams = Q::ifset($params, 'relatedParams', array());

	$publisherId = Q::ifset($params, 'streamParams', 'publisherId', Users::loggedInUser(true)->id);
    $streamType = 'Streams/audio';
    $attributes = Q::ifset($params, 'streamParams', 'attributes', array());
    $url = Q::ifset($attributes, 'url', null);

    $streamParams['icon'] = $streamType;

    // if url specified, add special attributes
    if ($url) {
        $parsed = parse_url($url);
        $host = Q::ifset($parsed, 'host', null);
         if (false !== stripos($host, 'soundcloud.com')) {
             $attributes['platform'] = 'soundcloud';
             $streamParams['icon'] = 'Streams/soundcloud';
         }
    }

    $stream = Streams::create(null, $publisherId, $streamType, $streamParams, $relatedParams);

    Q_Response::setSlot('stream', $stream);

    return $stream;
}