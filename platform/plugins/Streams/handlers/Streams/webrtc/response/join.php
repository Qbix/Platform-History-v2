<?php

//require USERS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

//use Minishlink\WebPush\WebPush;

function Streams_webrtc_response_join($params = array()) {
    $params = array_merge($_REQUEST, $params);

    $loggedUserId = Users::loggedInUser(true)->id;
    $communityId = Users::communityId();
    $streamName = Q::ifset($params, 'streamName', null);
    $publisherId = Q::ifset($params, 'publisherId', null);

    if($streamName && $publisherId) {
        $stream = Streams::fetchOne($loggedUserId, $publisherId, $streamName);
        $participants = $stream->getParticipants(array(
            "state" => "participating"
        ));
        if (!isset($participants[$loggedUserId])) {
            $stream->join();
        } else {

            Streams_Message::post(null, $publisherId, $streamName, array(
                'type' => 'Streams/connected'
            ), true);
        }

        Q_Response::setSlot('join', $stream);
    }
}