<?php

function Streams_webrtc_response_join($params = array()) {
    $params = array_merge($_REQUEST, $params);

    $loggedUserId = Users::loggedInUser(true)->id;
    $communityId = Users::communityId();
    $publisherId = Q::ifset($params, 'publisherId', null);
    $streamName = Q::ifset($params, 'streamName', null);

	$adapter = Streams_WebRTC_Twilio();
    $roomStream = $adapter->joinRoom($loggedUserId, $publisherId, $streamName);

    Q_Response::setSlot('join', $roomStream);

}