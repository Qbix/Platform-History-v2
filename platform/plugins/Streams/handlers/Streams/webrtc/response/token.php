<?php
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Rest\Client;

function Streams_webrtc_response_token($params = []) {
    $params = array_merge($_REQUEST, $params);

    $loggedUserId = Users::loggedInUser(true)->id;
    $publisherId = Q::ifset($params, 'publisherId', null);
    $roomName = Q::ifset($params, 'roomName', null);
    $streamName = Q::ifset($params, 'streamName', null);
    $stream = Streams::fetchOne($loggedUserId, $publisherId, $streamName);

    $sid = $stream->getAttribute('twilioRoomSid', null);
    if($sid && $stream->participant()) {

        $accessToken = Streams_Webrtc::getTwilioAccessToken($sid);
        Q_Response::setSlot('token', $accessToken);

    }
}


