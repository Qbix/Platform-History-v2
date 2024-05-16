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
    $stream = Streams_Stream::fetch($user->id, $publisherId, $streamName);
    if (!$stream->testAdminLevel('manage')) {
        throw new Users_Exception_NotAuthorized();
    }
    // lock these attributes, but can't unlock afterwards from clients
    $stream->attributesLock($attributes, true);
    $stream->changed(); // save the stream, with the changes
}