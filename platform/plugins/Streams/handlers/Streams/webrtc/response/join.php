<?php

//require USERS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

//use Minishlink\WebPush\WebPush;

function Streams_webrtc_response_join() {

    $loggedUserId = Users::loggedInUser(true)->id;
    $communityId = Users::communityId();
    $streamName = $_REQUEST['streamName'];

    $stream = Streams::fetchOne($loggedUserId, $communityId, $streamName);
    $participants = $stream->getParticipants(array(
        "state" => "participating"
    ));
    if(!isset($participants[$loggedUserId])) $stream->join();

    Q_Response::setSlot('join', $stream);
}