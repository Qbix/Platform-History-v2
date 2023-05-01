<?php
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';


/**
 * @module Streams
 */

/**
 * Creates streams that are needed for livestreaming via
 * @class HTTP Streams livestream
 * @method post
 * @param {array} [$_REQUEST] Parameters that can come from the request
 *   @param {string} $_REQUEST.publisherId  Required. The id of the user to publish the stream.
 *   @param {string} $_REQUEST.roomId Pass an ID for the room from the client, may already exist
 *   @param {string} $_REQUEST.closeManually If true, stream is not closed automatically by node.js
 * @return {void}
 */
function Streams_livestream_post($params = array())
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

	//get livestream stream that was created by the person who opened livestream editor in webrtc chat room
	$livestreamStreamRelation = Streams_RelatedTo::select()->where(array(
		"toPublisherId" => $publisherId,
		"toStreamName" => $streamName,
		"type" => "Media/webrtc/livestream"
	))->orderBy("weight", false)->limit(1)->fetchDbRow();


	if(is_null($livestreamStreamRelation) || empty($livestreamStreamRelation)) {
		//if there is no livestream stream found, create it and relate it to webrtc stream of room
		$livestreamStream = Streams::create($loggedInUserId, $loggedInUserId, 'Media/webrtc/livestream', ['writeLevel' => 23]);
		$livestreamStream->subscribe();
		$livestreamStream->join(['subscribed' => true]);

		$livestreamStream->relateTo((object)array(
			"publisherId" => $publisherId,
			"name" => $streamName
		), "Media/webrtc/livestream", $loggedInUserId, array(
			"inheritAccess" => false,
			"weight" => time()
		));

		//create stream for public chat room and relate it to livestream stream
		$publicChatStream = Streams::create($loggedInUserId, $loggedInUserId, 'Media/webrtc/chat', ['title' => 'Public']);
		$publicChatStream->setAttribute('publicChat', true);
		$publicChatStream->changed();

		$publicChatStream->relateTo((object)array(
			"publisherId" => $livestreamStream->publisherId,
			"name" => $livestreamStream->name,
		), "Media/webrtc/livestream/chat", $loggedInUserId, array(
			"inheritAccess" => false,
			"weight" => 9999999999.0000
		));
		
	} else {
		//if livestream stream found, get related stream of public chat room
		$livestreamStream = Streams_Stream::fetch($loggedInUserId, $livestreamStreamRelation->fromPublisherId, $livestreamStreamRelation->fromStreamName);

		$publicChatStreamRelation = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $livestreamStream->publisherId,
			"toStreamName" => $livestreamStream->name,
			"type" => "Media/webrtc/livestream/chat",
			"weight" =>  9999999999.0000
		))->limit(1)->fetchDbRow();

		if(!is_null($publicChatStreamRelation)) {
			$publicChatStream = Streams_Stream::fetch($loggedInUserId, $publicChatStreamRelation->fromPublisherId, $publicChatStreamRelation->fromStreamName);
		} else {
			//create stream for public chat room and relate it to livestream stream
			$publicChatStream = Streams::create($loggedInUserId, $loggedInUserId, 'Media/webrtc/chat', ['title' => 'Public']);
			$publicChatStream->setAttribute('publicChat', true);
			$publicChatStream->changed();

			$publicChatStream->relateTo((object)array(
				"publisherId" => $livestreamStream->publisherId,
				"name" => $livestreamStream->name,
			), "Media/webrtc/livestream/chat", $loggedInUserId, array(
				"inheritAccess" => false,
				"weight" => 9999999999.0000
			));
		}
	}

	if (is_null($livestreamStream) || is_null($publicChatStream)) {
		throw new Q_Exception("Something went wrong when fetching livestream stream or public chat stream");
	}

	$response['livestreamStream'] = $livestreamStream;
	$response['publicChatStream'] = $publicChatStream;

	Q_Response::setSlot("livestream", $response);
}