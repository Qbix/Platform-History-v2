<?php

function Streams_video_post($params)
{
	$streamParams = Q::ifset($params, 'streamParams', array());
	$relatedParams = Q::ifset($params, 'relatedParams', array());

	$publisherId = Q::ifset($params, 'streamParams', 'publisherId', Users::loggedInUser(true)->id);
    $streamType = 'Streams/video';
    $attributes = Q::ifset($params, 'streamParams', 'attributes', array());
    $url = Q::ifset($attributes, 'url', null);

    $streamParams['icon'] = $streamType;

    // if url specified, add special attributes
    if ($url) {
        $parsed = parse_url($url);
        $host = Q::ifset($parsed, 'host', null);

         if (false !== Q::striposa($host, array("youtube.com", "youtu.be"))) {
             $attributes['platform'] = 'youtube';
             $streamParams['icon'] = 'Streams/youtube';
         } elseif (false !== stripos($host, "vimeo.com")) {
             $attributes['platform'] = 'vimeo';
             $streamParams['icon'] = 'Streams/video';
         }
    }

    $streamParams['attributes'] = $attributes;

    $stream = Streams::create(null, $publisherId, $streamType, $streamParams, $relatedParams);

    Q_Response::setSlot('stream', $stream);

    return $stream;
}