<?php

function Streams_attributesLock_response_result()
{
    $stream = Streams_Stream::fetch($userId, $publisherId, $streamName);
    $result = $stream->getAttribute(Streams_Stream::ATTRIBUTE_ATTRIBUTES_LOCKED, array());
}