<?php
require STREAMS_PLUGIN_DIR . DS . 'vendor' . DS . 'autoload.php';


/**
 * @module Streams
 */

/**
 * Creates category stream for call center
 * @class HTTP Streams callCenter
 * @method post
 * @return {void}
 */
function Streams_callCenter_post($params = array())
{
	$loggedInUserId = Users::loggedInUser(true)->id;
	$callCenterCategoryStream = Streams_Stream::fetch($loggedInUserId, $loggedInUserId, 'Streams/webrtc/callCenter/main');

	if (is_null($callCenterCategoryStream)) {
		$callCenterCategoryStream = Streams::create($loggedInUserId, $loggedInUserId, 'Streams/webrtc/callCenter', [
			'name' => 'Streams/webrtc/callCenter/main', 
			'title' => 'My Call Center',
			'writeLevel' => 23
		]);
	} 

	if (is_null($callCenterCategoryStream)) {
		throw new Q_Exception("Something went wrong when creating category for call center");
	}

	Q_Response::setSlot("callCenterStream", $callCenterCategoryStream);
}
