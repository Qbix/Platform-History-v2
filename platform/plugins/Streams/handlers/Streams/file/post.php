<?php

/**
 * @module Streams
 */

/**
 * Used by HTTP clients to update streams with type Streams/file
 * @class HTTP Streams file
 * @method post
 * @param {array} [$params] Parameters that can come from the request
 *   @param {string} $params.publisherId  Required. The id of the user to publish the stream.
 *   @param {string} $params.streamName Required. The name of the stream.
 *   @param {array} [$params.file] This is used to upload file for the stream.
 */
function Streams_file_post($params = array())
{
	$user = Users::loggedInUser(true);
	$req = array_merge($_REQUEST, $params);
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $req['publisherId'] = $user->id;
	}
	$type = Streams::requestedType(true);
	$streamName = Streams::requestedName(true);
    $types = Q_Config::expect('Streams', 'types');
    if (!array_key_exists($type, $types)) {
        throw new Q_Exception("This app doesn't support streams of type $type", 'type');
    }
	$edit = Streams_Stream::getConfigField($type, 'edit', false);
	if (!$edit) {
        throw new Q_Exception("This app doesn't let clients directly edit streams of type $type", 'type');
	}

	// Split the id for saving files in the filesystem
	$splitId = Q_Utils::splitId($publisherId);
	
	// get the stream
	$stream = Streams_Stream::fetch($user->id, $publisherId, $streamName);

	// Hold on to any file that was posted
	$file = null;
	if (!empty($_FILES) && is_array($_FILES)) {
		$file = array(
			'path' => 'Q'.DS.'uploads'.DS.'Streams',
			'subpath' => $splitId.DS."{$stream->name}".DS."file".DS.time()
		);
		
		Q::event("Q/file/post", $file);
		// the Streams/after/Q_file_save hook saves some attributes
	}

	// Re-fetch the stream object from the Streams::fetch cache,
	// since it might have been retrieved and modified to be different
	// from what is currently in $stream.
	// This also calculates the access levels on the stream.
	$stream = Streams_Stream::fetch($user->id, $publisherId, $stream->name, '*', array(
		'refetch' => true
	));
	
	Streams::$cache['stream'] = $stream;
}
