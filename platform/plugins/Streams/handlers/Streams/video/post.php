<?php

/**
 * TODO:
 * PLEASE document Streams/video/post.php handler properly, see how I did it
 * in other handlers.
 */
function Streams_video_post($params)
{
    // TODO: please make VIMEO UPLOADS BY FOLLOWING
    // https://developer.vimeo.com/api/upload/videos
    
    // Right now, Streams/video/post takes existing videos from youtube/vimeo
    // but please call Q::handle("Streams/video/create/$provider") with $_REQUEST params
    // if $_REQUEST['create'] is set, otherwise call
    // Q::handle("Streams/video/import/$provider") and move below handlers in files
    // for youtube, vimeo, etc.

    // The handlers would make for example an instance of Q_Video_Vimeo
    // and call ->create() on it, and then return info "create" slot to the client

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