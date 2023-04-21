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
	$loggedInUserId = Users::loggedInUser(true)->id;
	$publisherId = Q::ifset($params, 'publisherId', $loggedInUserId);
	$roomId = Q::ifset($params, 'roomId', null);
	$inviteToken = Q::ifset($params, 'inviteToken', null);
	$invitingUserId = Q::ifset($params, 'invitingUserId', null);
	$socketId = Q::ifset($params, 'socketId', null);
	$callDescription = Q::ifset($params, 'description', null);
	$resumeClosed = Q::ifset($params, 'resumeClosed', null);
	$relate = Q::ifset($params, 'relate', null);
	$content = Q::ifset($params, 'content', null);
	$onlyPreJoinedParticipantsAllowed = filter_var(Q::ifset($params, 'onlyParticipantsAllowed', false), FILTER_VALIDATE_BOOLEAN);
	$taskStreamName = Q::ifset($params, 'taskStreamName', null);
    $writeLevel = Q::ifset($params, 'writeLevel', 23);
    $closeManually = Q::ifset($params, 'closeManually', null);
	$useRelatedTo = filter_var(Q::ifset($params, 'useRelatedTo', false), FILTER_VALIDATE_BOOLEAN);

    if(Q_Request::slotName('data')) {
        //this is requests which were sent by node.js when some event was fired (client.on('disconnect'), for example)

        $cmd = Q::ifset($params, 'cmd', null);
        $streamName = Q::ifset($params, 'streamName', null);
        $publisherId = Q::ifset($params, 'publisherId', $loggedInUserId);
        $hostSocketId = Q::ifset($params, 'hostSocketId', null);

        if($cmd == 'closeStream') {
            //this slot is used to close stream when user closes browser tab and disconnect socket event is fired
            $streamToClose = Streams_Stream::fetch(null, $publisherId, $streamName);
    
            if(!is_null($streamToClose)) {
                $streamToClose->setAttribute('status', 'closed');
                //$streamToClose->close($publisherId);
                $streamToClose->save();
                $streamToClose->changed();
            }
    
            return Q_Response::setSlot('data', ['cmd'=> $cmd, 'publisherId' => $publisherId, 'streamName' => $streamName]);
        } else if($cmd == 'closeIfOffline') {
            //this slot is used to close inactive stream when a host loades list of waiting rooms (we should close waiting rooms of users thar are inactive)

            $userIsOnline = filter_var(Q::ifset($params, 'userIsOnline', false), FILTER_VALIDATE_BOOLEAN);
            $webrtcStream = Streams_Stream::fetch(null, $publisherId, $streamName);
    
            $streamWasClosed = false;
            if($userIsOnline === false) {
                //$webrtcStream->close($publisherId);
                $webrtcStream->setAttribute('status', 'closed');
                $webrtcStream->save();
                $webrtcStream->changed();
                $streamWasClosed = true;
            }
    
            return Q_Response::setSlot('data', ['cmd'=> $cmd, 'streamWasClosed' =>  $streamWasClosed, 'userIsOnline' => $userIsOnline, 'publisherId' => $publisherId, 'streamName' => $streamName]);
        }
    } else if(Q_Request::slotName('closeIfOffline')) {
        if (!$loggedInUserId) {
            throw new Exception('You are not authorized to do this action');
        }
        $streamName = Q::ifset($params, 'streamName', null);
        $publisherId = Q::ifset($params, 'publisherId', null);
        $hostSocketId = Q::ifset($params, 'hostSocketId', null);
        $usersSocketId = Q::ifset($params, 'socketId', null);
        if(!$usersSocketId) {
            $streamToClose = Streams_Stream::fetch(null, $publisherId, $streamName);
    
            if(!is_null($streamToClose)) {
                $streamToClose->setAttribute('status', 'closed');
                //$streamToClose->close($publisherId);
                $streamToClose->save();
                $streamToClose->changed();
            }
            return Q_Response::setSlot("closeIfOffline", 'done');
        }
        if(!$streamName || !$publisherId || !$hostSocketId) {
            throw new Exception('streamName, publisherId, hostSocketId are required');
        }
        Q_Utils::sendToNode(array(
            "Q/method" => "Users/checkIfOnline",
            "socketId" => $usersSocketId,
            "userId" => $publisherId,
            "operatorSocketId" => $hostSocketId,
            "operatorUserId" => $loggedInUserId,
            "handlerToExecute" => 'Streams/webrtc',
            "data" => [
                "cmd" => 'closeIfOffline',
                "publisherId" => $publisherId,
                "streamName" => $streamName
            ],
        ));
        
        return Q_Response::setSlot("closeIfOffline", 'done');
    } else if(Q_Request::slotName('admitUserToRoom')) {
        $streamName = Q::ifset($params, 'streamName', null);
        $publisherId = Q::ifset($params, 'publisherId', null);
        $waitingRoomStreamName = Q::ifset($params, 'waitingRoomStreamName', null);
        $userIdToAdmit = Q::ifset($params, 'userIdToAdmit', null);

        $webrtcStream = Streams_Stream::fetch($loggedInUserId, $publisherId, $streamName);
        if(!$webrtcStream->testAdminLevel('manage')) {
            throw new Exception('Your are not authorized to do this action');
        }

        $access = new Streams_Access();
        $access->publisherId = $publisherId;
        $access->streamName = $streamName;
        $access->ofUserId = $userIdToAdmit;
        $access->retrieve();
        $access->readLevel = Streams::$READ_LEVEL['max'];
        $access->save();

        $waitingRoomStream = Streams_Stream::fetch($userIdToAdmit, $userIdToAdmit, $waitingRoomStreamName);

        //print_r($waitingRoomStream);die;
        if (!is_null($waitingRoomStream)) {
            $waitingRoomStream->setAttribute('status', 'accepted');    
            //$waitingRoomStream->close($userIdToAdmit);
            $waitingRoomStream->save();
            $waitingRoomStream->changed();

            $waitingRoomStream->post($userIdToAdmit, array(
                'type' => 'Streams/webrtc/admit',
                'instructions' => ['msg' => 'You will be joined to the room now']
            ));
        }
    
        return Q_Response::setSlot("admitUserToRoom", 'done');
    } else if(Q_Request::slotName('cancelAccessToRoom')) {
        $streamName = Q::ifset($params, 'streamName', null);
        $publisherId = Q::ifset($params, 'publisherId', null);
        $userId = Q::ifset($params, 'userId', null);

        $webrtcStream = Streams_Stream::fetch($loggedInUserId, $publisherId, $streamName);
        if(!$webrtcStream->testAdminLevel('manage')) {
            throw new Exception('Your are not authorized to do this action');
        }

        $access = new Streams_Access();
        $access->publisherId = $publisherId;
        $access->streamName = $streamName;
        $access->ofUserId = $userId;
        $access->retrieve();
        $access->readLevel = Streams::$READ_LEVEL['none'];
        $access->save();
    
        return Q_Response::setSlot("cancelAccessToRoom", 'done');
    } else if(Q_Request::slotName('closeWaitingRoom')) {
        $streamName = Q::ifset($params, 'streamName', null);
        $publisherId = Q::ifset($params, 'publisherId', null);
        $waitingRoomStreamName = Q::ifset($params, 'waitingRoomStreamName', null);
        $waitingRoomUserId = Q::ifset($params, 'waitingRoomUserId', null);

        $webrtcStream = Streams_Stream::fetch($loggedInUserId, $publisherId, $streamName);
        if(!$webrtcStream->testAdminLevel('manage')) {
            throw new Exception('Your are not authorized to do this action');
        }

        $waitingRoomStream = Streams_Stream::fetch($waitingRoomUserId, $waitingRoomUserId, $waitingRoomStreamName);

        if (!is_null($waitingRoomStream)) {
            $waitingRoomStream->setAttribute('status', 'closed');    
            //$waitingRoomStream->close($userIdToAdmit);

            $waitingRoomStream->save();
            $waitingRoomStream->changed();
            
            $waitingRoomStream->post($waitingRoomUserId, array(
                'type' => 'Streams/webrtc/close',
                'instructions' => ['msg' => 'Your waiting room was closed.']
            ));
        }
    
        return Q_Response::setSlot("closeWaitingRoom", 'done');
    } else if(Q_Request::slotName('recording')) {
        //this slot is not used for now; it is supposed to merge separate audio recordings of webrtc conference into one file
        $communityId = Q::ifset($_REQUEST, 'communityId', Users::communityId());
        $luid = Users::loggedInUser(true)->id;
        $app = Q::app();

        $task = isset($_REQUEST['taskStreamName'])
            ? Streams_Stream::fetch($luid, $communityId, $taskStreamName, true)
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
    if(!is_null($inviteToken) && !is_null($invitingUserId)){

        $webrtcStream = $webrtc->getRoomStreamByInviteToken($inviteToken, $resumeClosed);
        if (!$webrtcStream) {
            throw new Exception("Room does not exist");
        };
        if ($webrtcStream->testReadLevel("max")) {
            if ($resumeClosed) {
                $webrtcStream->closedTime = null;
                $webrtcStream->changed();
    
                $endTime = $webrtcStream->getAttribute('endTime');
                $startTime = $webrtcStream->getAttribute('startTime');
                if ($startTime == null || ($endTime != null && round(microtime(true) * 1000) > $endTime)) {
                    $startTime = round(microtime(true) * 1000);
                    $webrtcStream->setAttribute('startTime', $startTime);
                    $webrtcStream->clearAttribute('endTime');
                    $webrtcStream->save();
                }
            }
        } else {
            $waitingRoomStream = $webrtc->getRoomStreamRelatedTo($webrtcStream->fields["publisherId"], $webrtcStream->fields["name"], $loggedInUserId, null, 'Streams/webrtc/waitingRoom', true);

            //print_r($waitingRoomStream);die;
            if(is_null($waitingRoomStream)) {
                $waitingRoomStream = $webrtc->createWaitingRoomStream();
                $newStream = true;
            }
            
            $waitingRoomStream->setAttribute('socketId', $socketId);
            $waitingRoomStream->setAttribute('status', 'waiting');
            $waitingRoomStream->save();
            $waitingRoomStream->join(['subscribed' => true]);
            $waitingRoomStream->subscribe(['userId' => $webrtcStream->fields['publisherId']]);
            if ($newStream) {
                $waitingRoomStream->relateTo((object)array(
                    "publisherId" => $webrtcStream->fields["publisherId"],
                    "name" => $webrtcStream->fields["name"]
                ), 'Streams/webrtc/waitingRoom', $webrtcStream->fields["publisherId"], array(
                    "inheritAccess" => true,
                    "weight" => time()
                ));
            } else {
                $waitingRoomStream->changed();
            }
            $response['waitingRoomStream'] = $waitingRoomStream;

            //if user closes tab with waiting room, we should close waiting room stream
            Q_Utils::sendToNode(array(
                "Q/method" => "Users/addEventListener",
                "socketId" => $socketId,
                "userId" => $loggedInUserId,
                "eventName" => 'disconnect',
                "handlerToExecute" => 'Streams/webrtc',
                "data" => [
                    "cmd" => 'closeStream',
                    "publisherId" => $waitingRoomStream->fields['publisherId'],
                    "streamName" => $waitingRoomStream->fields['name']
                ],
            ));

            return Q_Response::setSlot("room", $response);  
            
        }      
    } else if($useRelatedTo && !empty($relate)) {
        $webrtcStream = $webrtc->getRoomStreamRelatedTo($relate["publisherId"], $relate["streamName"], null, null, $relate["relationType"], $resumeClosed);
    
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
        $meAsParticipant = $response['stream']->participant();
        if (!$meAsParticipant || $meAsParticipant->fields['state'] != 'participating') {
            $response['stream']->join();
        }
        
    } else {
        $meAsParticipant = $response['stream']->participant();
        if (!$meAsParticipant || $meAsParticipant->fields['state'] != 'participating') {
            throw new Exception('Only those who already are participants allowed to join this room');
        }
    }

    $response['stream']->save();

	Q_Response::setSlot("room", $response);
}