<?php
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

use Twilio\Jwt\AccessToken;
use Twilio\Jwt\Grants\VideoGrant;
use Twilio\Rest\Client;
/**
 * @module Streams
 */

interface Streams_WebRTC_Interface
{
    /**
     * Interface that an adapter must support
     * to implement the Streams_WebRTC class.
     * @class Streams_WebRTC_Interface
     * @constructor
     */

    /**
     * TODO: please document every method
     */
    function createRoom($publisherId, $roomId);

}

/**
 * Base class for Streams_WebRTC_... adapters
 *
 * @class Streams_WebRTC
 */
abstract class Streams_WebRTC
{

    /**
     * @method getTwilioTurnCredentials Retrievs credentials for using twilio turn server
     * @return {Array|null}
     * @throws Twilio_Exception
     */
    function getTwilioTurnCredentials() {
        $twilioAccountSid = Q_Config::expect('Streams', 'twilio', 'accountSid');
        $twilioApiKey = Q_Config::expect('Streams', 'twilio', 'apiKey');
        $twilioApiSecret = Q_Config::expect('Streams', 'twilio', 'apiSecret');
        $authToken = Q_Config::expect('Streams', 'twilio', 'authToken');

        $twilio = new Client($twilioApiKey, $twilioApiSecret, $twilioAccountSid);

        $token = $twilio->tokens->create();

        return $token->iceServers[1];
    }

};