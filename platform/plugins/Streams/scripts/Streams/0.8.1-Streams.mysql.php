<?php

function Streams_0_8_1_Streams_mysql()
{	
	$app = Q_Config::expect('Q', 'app');
	$commmunityId = Users::communityId();
	
	// template for community stream
	$stream = new Streams_Stream();
	$stream->publisherId = '';
	$stream->name = 'Streams/community/';
	$stream->type = 'Streams/template';
	$stream->title = "Community";
	$stream->content = '';
	$readLevel = Streams::$READ_LEVEL['content'];
	$writeLevel = Streams::$WRITE_LEVEL['join'];
	$adminLevel = Streams::$ADMIN_LEVEL['invite'];
	$stream->save();
	
	// app community stream, for announcements
	Streams::create($commmunityId, $commmunityId, 'Streams/community', array(
		'skipAccess' => true,
		'name' => 'Streams/community/main',
		'title' => "$app Community"
	));
	
	// symlink the labels folder
	if (!file_exists('Streams')) {
		Q_Utils::symlink(
			STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons'.DS.'labels'.DS.'Streams',
			USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'icons'.DS.'Streams'
		);
	}
}

Streams_0_8_1_Streams_mysql();