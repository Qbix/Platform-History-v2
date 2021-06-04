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
 *   @param {string} [$_REQUEST.adapter='node'] Required. The type of the message.
 * @return {void}
 */
function Streams_webrtc_post($params = array())
{
	$params = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$publisherId = Q::ifset($params, 'publisherId', $loggedInUserId);
	$roomId = Q::ifset($params, 'roomId', null);
	$adapter = Q::ifset($params, 'adapter', 'node');
	$resumeClosed = Q::ifset($params, 'resumeClosed', null);
	$relate = Q::ifset($params, 'relate', null);
	$content = Q::ifset($params, 'content', null);
	$taskStreamName = Q::ifset($params, 'taskStreamName', null);

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
            'instructions' => compact('progress'),
        ), true);

        Q_Response::setSlot("progress", $taskStream);

        return;
    }

    Q_Valid::requireFields(array('publisherId', 'adapter'), $params, true);


    // check maxCalls
	if (!empty($relate)) {
		// if calls unavailable, throws exception
		Streams::checkAvailableRelations($publisherId, $relate["publisherId"], $relate["streamName"], $relate["relationType"], array(
			"postMessage" => false,
			"throw" => true,
			"singleRelation" => true
		));
	}

	if (!in_array($adapter, array('node', 'twilio'))) {
		throw new Q_Exception_WrongValue(array('field' => 'adapter', 'range' => 'node or twilio'));
	}

	$className = "Streams_WebRTC_".ucfirst($adapter);

	$webrtc = new $className();
	$result = $webrtc->createOrJoinRoom($publisherId, $roomId, $resumeClosed);

	if ($publisherId == $loggedInUserId) {
		if ($content) {
			$result['stream']->content = $content;
			$result['stream']->changed();
		}
	}

	if (!empty($relate)) {
		$result['stream']->relateTo((object)array(
			"publisherId" => $relate["publisherId"],
			"name" => $relate["streamName"]
		), $relate["relationType"], $result['stream']->publisherId, array(
			"inheritAccess" => true,
			"weight" => time()
		));
	}

	if ($resumeClosed !== null) {
		$result['stream']->setAttribute("resumeClosed", $resumeClosed)->save();
	}
	$result['stream']->join();

	Q_Response::setSlot("room", $result);
}