<?php
//require_once('twilio-php-master/Twilio/autoload.php'); // Loads the library
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Rest\Client;

function Streams_webrtc_post()
{

    $communityId = Users::communityId();
    $roomId = makeId();

    $stream = Streams::create($communityId, $communityId, 'Streams/webrtc', array(
        'name' => 'Streams/webrtc/' . $roomId,
    ));
    $stream->join();

    Q_Response::setSlot("token", $stream);
    Q_Response::setSlot("stream", $stream);

}

function makeId() {
    $text = "";
    $possible = "0123456789";
    $max = strlen($possible)-1;
    for ($i = 0; $i < 6; $i++) {
        $text .= $possible[rand(0,$max)];
    }
    return wordwrap($text, 2, "-", true);
}

function getTwilioAccessToken() {
    // Substitute your Twilio AccountSid and ApiKey details
    $twilioAccountSid = 'AC75ba7743f86c5d7b7bc88337ae7c5516';
    $twilioApiKey = 'SK97dc9f423224b1264a8b71018a813257';
    $twilioApiSecret = 'quHKsPmsom8Jm4eZr9XSc99iFdzf5Zvc';

    $identity = isset($_GET['name']) ? $_GET['name'] : 'anonymous';
//die($identity);
// The specific Room we'll allow the user to access
    $roomName = $_GET['roomName'];

// Create access token, which we will serialize and send to the client
    $token = new AccessToken($twilioAccountSid, $twilioApiKey, $twilioApiSecret, 3600, $identity);


    $twilio = new Client($twilioAccountSid, $twilioApiKey);

    $room = $twilio->video->v1->rooms
        ->create(array("uniqueName" => "DailyStandup"));
    return 'aaa';
// Create Video grant
    $videoGrant = new VideoGrant();
    $videoGrant->setRoom($roomName);

// Add grant to token
    $token->addGrant($videoGrant);
// render token to string
    return $token->toJWT();
}