<?php

function Streams_webrtc_response_status($params = array()) {
    $params = array_merge($_REQUEST, $params);

    $loggedUserId = Users::loggedInUser(true)->id;
    $publisherId = Q::ifset($params, 'publisherId', null);
    $roomId = Q::ifset($params, 'roomId', null);
    $streamName = "Streams/webrtc/" . str_replace("Streams/webrtc/", "", $roomId);

    $stream = Streams::fetchOne($loggedUserId, $publisherId, $streamName);
    $endTime = $stream->getAttribute('endTime');
    Q_Response::setSlot('status', [
        'live' => is_null($endTime) && is_null($stream->fields['closedTime']) ? true : false,
        'stream' => $stream
    ]);
}