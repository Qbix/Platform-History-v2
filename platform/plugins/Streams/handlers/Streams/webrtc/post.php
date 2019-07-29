<?php
//require_once('twilio-php-master/Twilio/autoload.php'); // Loads the library
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';


/**
 * @module Streams
 */

/**
 * Used to post a message to an existing stream.
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
	Q_Valid::requireFields(array('publisherId', 'adapter'), $params, true);
	$loggedUserId = Users::loggedInUser(true)->id; // require that user's logged in
	$publisherId = Q::ifset($params, 'publisherId', $loggedUserId);
	$roomId = Q::ifset($params, 'roomId', null);
	$adapter = Q::ifset($params, 'adapter', 'node');

	if (!in_array($adapter, array('node', 'twilio'))) {
		throw new Q_Exception_WrongValue(array('field' => 'adapter', 'range' => 'node or twilio'));
	}

	$className = "Streams_WebRTC_".ucfirst($adapter);

	// check quota
	//$quota = Users_Quota::check($loggedUserId, '', 'Streams/webrtc', true, 1, Users::roles());

	$webrtc = new $className();
	$roomStream = $webrtc->createOrJoinRoom($publisherId, $roomId);
	$roomStream->stream->join();

	// set quota
	/*if ($quota instanceof Users_Quota) {
		$quota->used();
	}*/

	Q_Response::setSlot("room", $roomStream);
}