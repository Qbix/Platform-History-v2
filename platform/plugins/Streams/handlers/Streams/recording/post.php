<?php
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';


function Streams_recording_post($params = array())
{
	$params = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$publisherId = Q::ifset($params, 'publisherId', $loggedInUserId);
	$streamName = Q::ifset($params, 'streamName', null);

	$webrtcStream = Streams_Stream::fetch($publisherId, $publisherId, $streamName);

	if (!$webrtcStream) {
		throw new Q_Exception("Please pass WebRTC stream's name and publisher id as params for this request.");
	}

	$response = [];

	$recordingStream = Streams::create($loggedInUserId, $loggedInUserId, 'Streams/webrtc/recording', ['writeLevel' => 23]);
	$recordingStream->subscribe();
	$recordingStream->join(['subscribed' => true]);

	$recordingStream->relateTo((object)array(
		"publisherId" => $publisherId,
		"name" => $streamName
	), "Streams/webrtc/recording", $loggedInUserId, array(
		"inheritAccess" => false,
		"weight" => time()
	));

	if (is_null($recordingStream)) {
		throw new Q_Exception("Something went wrong");
	}

	$response['recordingStream'] = $recordingStream;

	Q_Response::setSlot("recording", $response);
}