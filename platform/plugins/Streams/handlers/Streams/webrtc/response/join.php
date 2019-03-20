<?php

function Streams_webrtc_response_join($params = array()) {
    $params = array_merge($_REQUEST, $params);

    $loggedUserId = Users::loggedInUser(true)->id;
    $communityId = Users::communityId();
    $streamName = Q::ifset($params, 'streamName', null);
    $publisherId = Q::ifset($params, 'publisherId', null);


    $roomStream = Streams_Webrtc::joinRoom($loggedUserId, $publisherId, $streamName);

    Q_Response::setSlot('join', $roomStream);

}