<?php

/**
 * Used to update an existing stream
 *
 * @param string $params Must include "publisherId" as well as "name" or "streamName".
 *    Can also include 'type', 'title', 'icon', 'content', 'attributes', 'readLevel',
 *    'writeLevel', 'adminLevel', as well as any fields named in the
 *    'Streams'/'types'/$type/'fields' config field for this $type of stream.
 * @param {string} [$params.publisherId] The id of the user publishing the stream
 * @param {string} [$params.name] The name of the stream
 * @param {string} [$params.streamName] Alternatively, the name of the stream
 * @param {array} [$params.attributes] Array of attributeName => value to set in stream.
 * @param {array} [$params.icon] Optional array of icon data (see Q_Image::save params)
 * @return {}
 */

function Streams_stream_put($params) {
	// only logged in user can edit stream
	$user = Users::loggedInUser(true);
	
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $_REQUEST['publisherId'] = $user->id;
	}
	$name = Streams::requestedName(true);
	$req = array_merge($_REQUEST, $params);

	if (array_key_exists('closedTime', $req)) {
		$closedTime = $req['closedTime'];
		if (in_array($closedTime, array(false, 'false', 'null'))) {
			$req['closedTime'] = null;
		}
	}

	// do not set stream name
	$stream = Streams::fetchOne($user->id, $publisherId, $name);	
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "{publisherId: '$publisherId', name: '$name'}"
		));
	}
	
	// valid stream types should be defined in config by 'Streams/type' array
	$range = Q_Config::expect('Streams', 'types');
	if (!array_key_exists($stream->type, $range)) {
		throw new Q_Exception("This app doesn't support streams of type ".$stream->type);
	}
	
	// check if editing directly from client is allowed
	$edit = Streams_Stream::getConfigField($stream->type, 'edit', false);
	if (!$edit) {
		throw new Q_Exception("This app doesn't let clients directly edit streams of type '{$stream->type}'");
	}
	
	$suggest = false;
	if ($stream->publisherId != $user->id) {
		$stream->calculateAccess($user->id);
		if (!$stream->testWriteLevel('edit')) {
			if ($stream->testWriteLevel('suggest')) {
				$suggest = true;
			} else {
				throw new Users_Exception_NotAuthorized();
			}
		}
	}
	
	$restricted = array(
		'readLevel', 'writeLevel', 'adminLevel', 
		'permissions', 'inheritAccess', 'closedTime'
	);
	$owned = $stream->testAdminLevel('own'); // owners can reopen streams
	foreach ($restricted as $r) {
		if (isset($req[$r]) and !$owned) {
			throw new Users_Exception_NotAuthorized();
		}
	}
	
	// handle setting of attributes
	if (isset($req['attributes'])
	and is_array($req['attributes'])) {
		foreach ($req['attributes'] as $k => $v) {
			$stream->setAttribute($k, $v);
		}
		unset($req['attributes']);
	}
	
	// Get all the extended field names for this stream type
	$fieldNames = Streams::getExtendFieldNames($stream->type);
	
	// Prevent editing restricted fields
	if (is_array($edit)) {
		$restrictedFields = array_diff($fieldNames, $edit);
		foreach ($restrictedFields as $fieldName) {
			if (in_array($fieldName, array('publisherId', 'name', 'streamName'))) {
				continue;
			}
			if (isset($req[$fieldName])) {
				throw new Users_Exception_NotAuthorized();
			}
		}
	}

	// Process any icon that was posted
	$icon = Q::ifset($fieldNames, 'icon', null);
	if (is_array($icon)) {
		unset($fieldNames['icon']);
		Q_Response::setSlot('icon', Q::event("Q/image/post", $icon));
	}
	
	// Process any file that was posted
	if (!empty($req['file']) and is_array($req['file'])) {
		$file = $req['file'];
		$file["name"] = $req["title"];
		unset($req['file']);

		if (empty($file['path'])) {
			$file['path'] = 'Q'.DS.'uploads'.DS.'Streams';
		}
		if (empty($file['subpath'])) {
			$splitId = Q_Utils::splitId($publisherId);
			$file['subpath'] = $splitId.DS."{$stream->name}".DS."file".DS.time();
		}
		Q_Response::setSlot('file', Q::event("Q/file/post", $file));
		// the Streams/after/Q_file_save hook saves some attributes

		// as Q/file/post changed stream, try to get stream from cache, so as not to lose the saved data
		$stream = Q::ifset(Streams::$cache, 'canWriteToStream', $stream);
	}

	if (!empty($fieldNames)) {
		foreach ($fieldNames as $f) {
			if (array_key_exists($f, $req)) {
				$stream->$f = $req[$f];
			}
		}
		$stream->changed($user->id,  $suggest ? 'Streams/suggest' : 'Streams/changed');
	}
	
	if (!empty($req['join'])) {
		$stream->join();
	}
	Streams::$cache['stream'] = $stream;
}