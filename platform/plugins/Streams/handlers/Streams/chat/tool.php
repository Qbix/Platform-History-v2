<?php

/**
 * @module Streams-tools
 */

/**
 * Renders chat tool.
 * @class Streams chat
 * @constructor
 * @param {array} $options Options for the tool
 * @param {string} $options.publisherId Publisher id of the stream to get messsages from.
 * @param {string} $options.streamName Required. Name of the stream to get messsages from.
 * @param {Streams_Stream} [$options.stream] You can pass this instead of publisherId and streamName
 * @param {string} [$options.loadMore] May have one these values: 'scroll', 'click' or 'pull' which indicates what kind of algorithm will be used for loading new messages. 'scroll' means that new messages will be loaded when scrollbar of the chat cointainer reaches the top (for desktop) or whole document scrollbar reaches the top (for android). 'click' will show label with 'Click to see earlier messages' and when user clicks it, new messages will be loaded. Finally, 'pull' implements 'pull-to-refresh' behavior used in many modern applications today when new messages loaded by rubber-scrolling the container by more amount than it actually begins. Defaults to 'scroll' for desktop and Android devices and 'pull' for iOS devices.
*/
function Streams_chat_tool($options)
{
	$user = Users::loggedInUser();
	$userId = $user ? $user->id : '';

	/*
	$defaults = array(
		'loadMore'         => (Q_Request::isTouchscreen() && Q_Request::platform() != 'android') ? 'click' : 'scroll',
		'messagesToLoad'   => 5,
		'messageMaxHeight' => 200
	);
	$options = array_merge($defaults, $options);
	*/
	extract($options);
	
	if (isset($stream)) {
		$options['publisherId'] = $stream->publisherId;
		$options['streamName'] = $stream->name;
		unset($options['stream']);
	} else {
		if (!isset($publisherId)) {
			$publisherId = Streams::requestedPublisherId(true);
		}
		if (!isset($streamName)) {
			$streamName = Streams::requestedName();
		}
		$stream = Streams_Stream::fetch($userId, $publisherId, $streamName);
		if (!$stream) {
			throw new Q_Exception_MissingRow(array(
				'table'    => 'stream',
				'criteria' => @compact('publisherId', 'streamName')
			));
		}
	}


	$options['userId'] = $userId;

	Q_Response::setToolOptions($options);
}