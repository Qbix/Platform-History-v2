<?php
//require_once('twilio-php-master/Twilio/autoload.php'); // Loads the library
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';


/**
 * @module Streams
 */

/**
 * Used to start a new Streams/webrtc stream (a real time audio/video call)
 * @class HTTP Streams webrtc
 * @method post
 * @param {array} [$_REQUEST] Parameters that can come from the request
 *   @param {string} $_REQUEST.publisherId  Required. The id of the user to publish the stream.
 *   @param {string} $_REQUEST.roomId Pass an ID for the room from the client, may already exist
 *   @param {string} $_REQUEST.closeManually If true, stream is not closed automatically by node.js
 * @return {void}
 */
function Streams_callCenter_post($params = array())
{
    $socketServerHost = Q_Config::get('Streams', 'webrtc', 'socketServerHost', '');
    $socketServerHost = trim(str_replace('/(http\:\/\/) || (https\:\/\/)/', '', $socketServerHost), '/');
    $socketServerPort = Q_Config::get('Streams', 'webrtc', 'socketServerPort', null);
    if(!empty($socketServerHost) && !empty($socketServerPort)){
        $socketServer = $socketServerHost . ':' . $socketServerPort;
    } else {
        $socketServer = trim(str_replace('/(http\:\/\/) || (https\:\/\/)/', '', Q_Config::get('Q', 'node', 'url', null)), '/');
    }

    $turnServers = Q_Config::get('Streams', 'webrtc', 'turnServers', []);
    $useTwilioTurn = Q_Config::get('Streams', 'webrtc', 'useTwilioTurnServers', null);
    $liveStreamingConfig = Q_Config::get('Streams', 'webrtc', 'liveStreaming', []);
    $globalLimitsConfig = Q_Config::get('Streams', 'webrtc', 'limits', []);
    $debug = Q_Config::get('Streams', 'webrtc', 'debug', false);

	$params = array_merge($_REQUEST, $params);
	$loggedInUser = Users::loggedInUser(true);
	$loggedInUserId = $loggedInUser->id;
	$streamName = Q::ifset($params, 'streamName', null);
	$publisherId = Q::ifset($params, 'publisherId', $loggedInUserId);
	$roomId = Q::ifset($params, 'roomId', null);
	$socketId = Q::ifset($params, 'socketId', null);
	$callDescription = Q::ifset($params, 'description', null);
	$resumeClosed = Q::ifset($params, 'resumeClosed', null);
	$relate = Q::ifset($params, 'relate', null);
	$content = Q::ifset($params, 'content', null);
	$onlyPreJoinedParticipantsAllowed = Q::ifset($params, 'onlyParticipantsAllowed', false);
    $writeLevel = Q::ifset($params, 'writeLevel', 23);
    $closeManually = Q::ifset($params, 'closeManually', null);
    $useRelatedTo = Q::ifset($params, 'useRelatedTo', null);

    if(Q_Request::slotName('data')) {
        //this is request that was sent by node.js when some event was fired (client.on('disconnect'), for example)
        $webrtcStream = Streams_Stream::fetch(null, $publisherId, $streamName);

        if(!is_null($webrtcStream)) {
            //return Q_Response::setSlot('data', ['publisherId' => $publisherId, 'streamName' => get_class_methods($webrtcStream)]);
            $webrtcStream->close($publisherId);
            $webrtcStream->changed();
            $webrtcStream->save();
        }

        return Q_Response::setSlot('data', ['publisherId' => $publisherId, 'streamName' => $streamName]);
    } else {
        if (!$socketId) {
            throw new Exception('To continue you should be connected to the socket server.');
        }

        $webrtc = new Streams_WebRTC_Node();

        if($useTwilioTurn) {
            try {
                $turnCredentials = $webrtc->getTwilioTurnCredentials();
                $turnServers = array_merge($turnServers, $turnCredentials);
            } catch (Exception $e) {
            }
        }
    
        $response = array(
            'socketServer' => $socketServer,
            'turnCredentials' => $turnServers,
            'debug' => $debug,
            'options' => array(
                'liveStreaming' => $liveStreamingConfig,
                'limits' => $globalLimitsConfig
            )
        );
    
        $webrtcStream = null;
        if(!empty($useRelatedTo) && !empty($useRelatedTo["publisherId"]) && !empty($useRelatedTo["streamName"]) && !empty($useRelatedTo["relationType"])) {
    
            $webrtcStream = $webrtc->getRoomStreamRelatedTo($useRelatedTo["publisherId"], $useRelatedTo["streamName"], $useRelatedTo["relationType"], $resumeClosed);
    
            if(is_null($webrtcStream)) {
                $webrtcStream = $webrtc->getRoomStream($publisherId, $roomId, $resumeClosed, $writeLevel);
            }
    
        } else {
            $webrtcStream = $webrtc->getRoomStream($publisherId, $roomId, $resumeClosed, $writeLevel);
        }
    
        $response['stream'] = $webrtcStream;
        $response['roomId'] = $webrtcStream->name;
    
        $specificLimitsConfig = $webrtcStream->getAttribute('limits', null);
    
        if(!is_null($specificLimitsConfig)) {
            if(isset($specificLimitsConfig['video'])) {
                $response['options']['limits']['video'] = $specificLimitsConfig['video'];
            }
            if(isset($specificLimitsConfig['audio'])) {
                $response['options']['limits']['audio'] = $specificLimitsConfig['audio'];
            }
            if(isset($specificLimitsConfig['minimalTimeOfUsingSlot'])) {
                $response['options']['limits']['minimalTimeOfUsingSlot'] = $specificLimitsConfig['minimalTimeOfUsingSlot'];
            }
            if(isset($specificLimitsConfig['timeBeforeForceUserToDisconnect'])) {
                $response['options']['limits']['timeBeforeForceUserToDisconnect'] = $specificLimitsConfig['timeBeforeForceUserToDisconnect'];
            }
        }
    
        // check maxCalls
        if (!empty($relate["publisherId"]) && !empty($relate["streamName"]) && !empty($relate["relationType"])) {
            // if calls unavailable, throws exception
            Streams::checkAvailableRelations($publisherId, $relate["publisherId"], $relate["streamName"], $relate["relationType"], array(
                "postMessage" => false,
                "throw" => true,
                "singleRelation" => true
            ));
        }
    
        if ($publisherId == $loggedInUserId || $response['stream']->testWriteLevel('edit')) {
            if ($content) {
                $response['stream']->content = $content;
                $response['stream']->changed();
            }
    
            if($onlyPreJoinedParticipantsAllowed) {
                $response['stream']->setAttribute("onlyParticipantsAllowed", true);
                $response['stream']->changed();
            }
        }
    
        if (!empty($relate["publisherId"]) && !empty($relate["streamName"]) && !empty($relate["relationType"])) {
            if($response['stream']->testWriteLevel('suggest')) {
                $response['stream']->relateTo((object)array(
                    "publisherId" => $relate["publisherId"],
                    "name" => $relate["streamName"]
                ), $relate["relationType"], $response['stream']->publisherId, array(
                    "inheritAccess" => true,
                    "weight" => time()
                ));
            } else {
                throw new Exception("You don't have permission to create a call.");
            }
        }
    
        if ($resumeClosed !== null) {
            $response['stream']->setAttribute("resumeClosed", $resumeClosed);
        }
    
        if ($closeManually !== null) {
            $response['stream']->setAttribute("closeManually", $closeManually);
        }
    
        if ($callDescription !== null) {
            $response['stream']->content = $callDescription;
        }
    
        if($response['stream']->getAttribute("onlyParticipantsAllowed") == false || $response['stream']->testWriteLevel('edit')) {
            $response['stream']->join();
        } else {
            $meAsParticipant = $response['stream']->participant();
            if (!$meAsParticipant || $meAsParticipant->fields['state'] != 'participating') {
                throw new Exception('Only those who already are participants allowed to join this room');
            }
        }
    
        $response['stream']->changed();
        $response['stream']->save();
    
    
        // close created stream when user is disconnected
        $sessionId = Q_Session::id();
    
        if ($loggedInUser) {
            Q_Utils::sendToNode(array(
                "Q/method" => "Users/addEventListener",
                "sessionId" => $sessionId,
                "socketId" => $socketId,
                "userId" => $loggedInUserId,
                "eventName" => 'disconnect',
                "handlerToExecute" => 'Streams/callCenter',
                "data" => [
                    "cmd" => 'closeStream',
                    "publisherId" => $response['stream']->publisherId,
                    "streamName" => $response['stream']->name
                ],
            ));
        }
    
        Q_Response::setSlot("room", $response);
    }
    
}