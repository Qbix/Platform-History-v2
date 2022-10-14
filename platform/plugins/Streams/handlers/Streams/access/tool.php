<?php

/**
 * @module Streams-tools
 */

/**
 * Access tool
 * @class Streams access
 * @constructor
 * @param {array} $options Options for the tool
 * @param {string} [$options.publisherId] the id of the user who is publishing the stream
 * @param {string} [$options.streamName] the name of the stream for which to edit access levels
 * @param {array} [$options.tabs] array of tab name => title. Defaults to read, write, admin tabs.
 * @param {array} [$options.ranges] associative array with keys "read", "write", "admin" and values as associative arrays of ($min, $max) for the displayed levels.
 * @param {boolean} [$options.controls] optionally set this to true to render only the controls
 */
function Streams_access_tool($options)
{
	$tabs = array(
		'read'  => 'visible to', 
		'write' => 'editable by', 
		'admin' => 'members'
	);
	extract($options);

	$user = Users::loggedInUser(true);
	/**
	 * @var string $streamName
	 */
	if (empty($streamName)) {
		$streamName = Streams::requestedName(true);
	}

	if (empty($publisherId)) {
		$publisherId = Streams::requestedPublisherId();
		if (empty($publisherId)) {
			$publisherId = $user->id;
		}
	}

	reset($tabs);
	$tab = Q::ifset($_REQUEST, 'tab', key($tabs));

	$stream = Streams_Stream::fetch($user->id, $publisherId, $streamName);
    if (!$stream) {
        throw new Q_Exception_MissingRow(array(
            'table' => 'stream',
            'criteria' => 'with that name'
        ));
	}
	$stream->addPreloaded($user->id);

	if (!$stream->testAdminLevel('own')) {
		throw new Users_Exception_NotAuthorized();
	}

	$access_array = Streams_Access::select()
		->where(array(
			'publisherId' => $stream->publisherId,
			'streamName' => $stream->name,
		))->andWhere("{$tab}Level != -1")->fetchDbRows();
		
	$labelRows = Users_Label::fetch($stream->publisherId, '', array(
		'checkContacts' => true
	));
	$labels = array();
	$icons = array();
	foreach ($labelRows as $label => $row) {
		$labels[$label] = $row->title;
		$icons[$label] = "labels/$label";
	}
	
	$userId_list = array();
	foreach ($access_array as $a) {
		if ($a->ofUserId) {
			$userId_list[] = $a->ofUserId;
		}
	}
	$avatar_array = empty($userId_list)
		? array()
		: Streams_Avatar::fetch($user->id, $userId_list);

	switch ($tab) {
		case 'read':
			$levels = Q_Config::get('Streams', 'readLevelOptions', array());
			break;
		case 'write':
			$levels = Q_Config::get('Streams', 'writeLevelOptions', array());
			break;
		case 'admin':
			$levels = Q_Config::get('Streams', 'adminLevelOptions', array());
			break;
	}
	if (isset($ranges[$tab])) {
		$range_min = reset($ranges[$tab]);
		$range_max = end($ranges[$tab]);
		foreach ($levels as $k => $v) {
			if ($k < $range_min) {
				unset($levels[$k]);
			}
			if ($k > $range_max) {
				unset($levels[$k]);
			}
		}
	}
	
	$accessActionUrl = Q_Uri::url("Streams/access"
			. "?publisherId=" . urlencode($publisherId)
			. "&streamName=" . urlencode($streamName));
	
	$dir = Q_Config::get('Users', 'paths', 'icons', 'files/Users/icons');
	
	$accessArray = Db::exportArray($access_array);
	$avatarArray = Db::exportArray($avatar_array);

	if (empty($controls)) {
		Q_Response::addScript("{{Streams}}/js/Streams.js", 'Streams');
		Q_Response::addScript("{{Streams}}/js/tools/access.js", 'Streams');
		Q_Response::addStylesheet("{{Streams}}/css/tools/access.css", 'Streams');
		Q_Response::setToolOptions(@compact(
			'accessArray', 'avatarArray', 'labels', 
			'icons', 'tab', 'publisherId', 
			'streamName'
		));
	} else {
		Q_Response::setSlot('extra', array(
			'stream' => $stream->exportArray(),
			'accessArray' => $accessArray,
			'avatarArray' => $avatarArray,
			'labels' => $labels,
			'icons' => $icons
		));
	}
	
	return Q::view('Streams/tool/access.php', @compact(
		'stream', 'tabs', 'tab', 'labels', 'icons',
		'levels', 'dir', 'publisherId', 'streamName', 'accessActionUrl',
		'controls'
	));
}