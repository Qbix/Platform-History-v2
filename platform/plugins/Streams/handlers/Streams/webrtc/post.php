<?php
//require_once('twilio-php-master/Twilio/autoload.php'); // Loads the library
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Rest\Client;

function Streams_webrtc_post($params = array())
{
    $params = array_merge($_REQUEST, $params);

    $loggedUserId = Users::loggedInUser(true)->id;
    $communityId = Users::communityId();
    $streamName = Q::ifset($params, 'streamName', null);
    $publisherId = Q::ifset($params, 'publisherId', null);

    $roomStream = Streams_Webrtc::createRoom($publisherId, $streamName);

    $roomStream->join();

    Q_Response::setSlot("stream", $roomStream);

}