<?php

function Streams_attributesLock_post()
{
    Q_Request::requireFields(array('publisherId', 'streamName', 'attribute'));
    $publisherId = $_REQUEST['publisherId'];
    $streamName = $_REQUEST['streamName'];
    $attributes = $_REQUEST['attributes'];
    if (is_string($attributes)) {
        $attributes = array($attributes);
    }
    $user = Users::loggedInUser(true);
    $stream = Streams_Stream::fetch($userId, $publisherId, $streamName);
    if (!$stream->testAdminLevel('manage')) {
        // lock these attributes, but can't unlock afterwards
        $stream->attributesLock($attributes, true);
    }
    $stream->changed(); // save the stream, with the changes
}