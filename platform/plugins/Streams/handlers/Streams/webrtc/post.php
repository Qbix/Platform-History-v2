<?php
//require_once('twilio-php-master/Twilio/autoload.php'); // Loads the library
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Rest\Client;

function Streams_webrtc_post($params = array())
{
    $params = array_merge($_REQUEST, $params);

    $roomStream = Streams_Webrtc::createRoom();
    //var_dump(class_exists('Streams_Webrtc'));die;
    //var_dump(method_exists('Streams_Webrtc', 'createRoom'));die;

    $roomStream->join();

    Q_Response::setSlot("stream", $roomStream);

}