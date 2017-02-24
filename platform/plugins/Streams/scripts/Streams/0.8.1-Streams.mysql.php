<?php

function Streams_0_8_1_Streams_mysql()
{
	$communityId = Users::communityId();
	
	// template for community experience stream
	$stream = new Streams_Stream();
	$stream->publisherId = '';
	$stream->name = 'Streams/experience/';
	$stream->type = 'Streams/template';
	$stream->title = "Community Experience";
	$stream->content = '';
	$stream->readLevel = Streams::$READ_LEVEL['content'];
	$stream->writeLevel = Streams::$WRITE_LEVEL['join'];
	$stream->adminLevel = Streams::$ADMIN_LEVEL['invite'];
	$stream->save();
	
	// main community experience stream, for community-wide announcements etc.
	$user = Users_User::fetch($communityId);
	Streams::create($communityId, $communityId, 'Streams/experience', array(
		'skipAccess' => true,
		'name' => 'Streams/experience/main',
		'title' => Users::communityName(),
		'icon' => $user ? $user->iconUrl() : null
	));
	
	// symlink the labels folder
	if (!file_exists('Streams')) {
		Q_Utils::symlink(
			STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons'.DS.'labels'.DS.'Streams',
			USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'icons'.DS.'labels'.DS.'Streams'
		);
	}
}

Streams_0_8_1_Streams_mysql();