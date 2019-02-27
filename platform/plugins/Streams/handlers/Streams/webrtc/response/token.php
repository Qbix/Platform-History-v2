<?php
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Rest\Client;

function Streams_webrtc_response_token() {



    // Substitute your Twilio AccountSid and ApiKey details
    $twilioAccountSid = 'AC338eba4af54011fa3a73425a8ae4716c';
    $twilioApiKey = 'SK299258ac97f231a76643b65ca08cf2ff';
    $twilioApiSecret = 'rUwOboEYwbzy0PHi31yDCLNiFZCh1eTZ';

    $identity = Users::loggedInUser(true)->displayName(array('short' => true));

    // The specific Room we'll allow the user to access
    $roomName = $_GET['roomName'];

// Create access token, which we will serialize and send to the client
    $token = new AccessToken($twilioAccountSid, $twilioApiKey, $twilioApiSecret, 3600, $identity);

// Create Video grant
    $videoGrant = new VideoGrant();
    $videoGrant->setRoom($roomName);

// Add grant to token
    $token->addGrant($videoGrant);
// render token to string
    Q_Response::setSlot('token', $token->toJWT());
}
