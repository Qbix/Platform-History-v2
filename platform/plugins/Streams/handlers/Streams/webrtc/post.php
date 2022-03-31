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
function Streams_webrtc_post($params = array())
{

    $socketServerHost = Q_Config::get('Streams', 'webrtc', 'socketServerHost', null);
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
    $debug = Q_Config::get('Streams', 'webrtc', 'debug', false);

	$params = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$publisherId = Q::ifset($params, 'publisherId', $loggedInUserId);
	$roomId = Q::ifset($params, 'roomId', null);
	$callDescription = Q::ifset($params, 'description', null);
	$resumeClosed = Q::ifset($params, 'resumeClosed', null);
	$relate = Q::ifset($params, 'relate', null);
	$content = Q::ifset($params, 'content', null);
	$onlyPreJoinedParticipantsAllowed = Q::ifset($params, 'onlyParticipantsAllowed', false);
	$taskStreamName = Q::ifset($params, 'taskStreamName', null);
    $writeLevel = Q::ifset($params, 'writeLevel', 10);
    $closeManually = Q::ifset($params, 'closeManually', null);
    $useRelatedTo = Q::ifset($params, 'useRelatedTo', null);

    if(Q_Request::slotName('recording')) {
        $communityId = Q::ifset($_REQUEST, 'communityId', Users::communityId());
        $luid = Users::loggedInUser(true)->id;
        $app = Q::app();

        $task = isset($_REQUEST['taskStreamName'])
            ? Streams::fetchOne($luid, $communityId, $taskStreamName, true)
            : Streams::create($luid, $communityId, 'Streams/task', array(
                'skipAccess' => true,
            )/*, array(
                'publisherId' => $app,
                'streamName' => "Streams/webrtc/meeting4",
                'type' => 'Streams/webrtc'
            )*/);
        Q_Response::setSlot("recording", $task);

        //Streams_WebRTC::mergeRecordings($publisherId, $roomId);
        return;
    } else if(Q_Request::slotName('progress')) {
        $communityId = Q::ifset($_REQUEST, 'communityId', Users::communityId());
        $luid = Users::loggedInUser(true)->id;
        $app = Q::app();

        $taskStream = Streams::fetchOne($luid, $communityId, $taskStreamName, true);
        $progress = '30';
        $taskStream->setAttribute('progress', $progress);
        $taskStream->save();
        $taskStream->post($luid, array(
            'type' => 'Streams/task/progress',
            'instructions' => @compact('progress'),
        ), true);


        Q_Response::setSlot("progress", $taskStream);

        return;
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
            'liveStreaming' => $liveStreamingConfig
        )
    );

    $webrtcStream = null;
    if(!empty($useRelatedTo) && !empty($useRelatedTo["publisherId"]) && !empty($useRelatedTo["streamName"]) && !empty($useRelatedTo["relationType"])) {

        $webrtcStream = $webrtc->getRoomStreamRelatedTo($useRelatedTo["publisherId"], $useRelatedTo["streamName"], $useRelatedTo["relationType"], $resumeClosed);acilmprsu

        if(is_null($webrtcStream)) {
            $webrtcStream = $webrtc->getRoomStream($publisherId, $roomId, $resumeClosed, $writeLevel);
        }

    } else {
        $webrtcStream = $webrtc->getRoomStream($publisherId, $roomId, $resumeClosed, $writeLevel);
    }

    $response['stream'] = $webrtcStream;
    $response['roomId'] = $webrtcStream->name;

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
        $response['stream']->relateTo((object)array(
			"publisherId" => $relate["publisherId"],
			"name" => $relate["streamName"]
		), $relate["relationType"], $response['stream']->publisherId, array(
			"inheritAccess" => true,
			"weight" => time()
		));
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

    $response['stream']->save();

	Q_Response::setSlot("room", $response);
}