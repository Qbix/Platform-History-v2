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

};