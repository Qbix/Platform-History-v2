<?php

function Streams_0_8_6_Streams_mysql()
{
	$app = Q::app();
	$communityId = Users::communityId();
	
	// access for managing community experiences
	$access = new Streams_Access();
	$access->publisherId = $communityId;
	$access->streamName = 'Streams/experience/';
	$access->ofUserId = '';
	$access->ofContactLabel = "$app/admins";
	$access->readLevel = Streams::$READ_LEVEL['relations'];
	$access->writeLevel = Streams::$WRITE_LEVEL['edit'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['own'];
	$access->save();
	
	// access for managing categories
	$access = new Streams_Access();
	$access->publisherId = $communityId;
	$access->streamName = 'Streams/category/';
	$access->ofUserId = '';
	$access->ofContactLabel = "$app/admins";
	$access->readLevel = Streams::$READ_LEVEL['messages'];
	$access->writeLevel = Streams::$WRITE_LEVEL['close'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['manage'];
	$access->save();
	
	// template to help users relate things to Streams/category streams
	Streams_Stream::insert(array(
		'publisherId' => '', 
		'name' => 'Streams/category/',
		'type' => 'Streams/template', 
		'title' => 'Untitled Category',
		'icon' => 'Streams/category',
		'content' => '',
		'attributes' => null,
		'readLevel' => Streams::$READ_LEVEL['messages'], 
		'writeLevel' => Streams::$WRITE_LEVEL['relate'], 
		'adminLevel' => Streams::$ADMIN_LEVEL['invite']
	))->execute();
	
	// template to help users create subcategories for things
	Streams_RelatedTo::insert(array(
		'toPublisherId' => '',
		'toStreamName' => 'Streams/category/',
		'type' => 'Streams/subcategories',
		'fromPublisherId' => '',
		'fromStreamName' => 'Streams/category/'
	))->execute();
}

Streams_0_8_6_Streams_mysql();