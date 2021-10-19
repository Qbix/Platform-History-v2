<?php

function Websites_0_9_1_Streams_mysql()
{
	$userId = Users::communityId();
	$ofUserId = '';
	$ofContactLabel = 'Websites/admins';
	$grantedByUserId = null;

	$streams = array(
		"Websites/presentation/" => array('type' => "Streams/template", "title" => "Untitled Presentation", "icon" => "{{Websites}}/img/icons/Websites/presentation", "content" => "", "deletable" => true),
		"Websites/slide/" => array('type' => "Streams/template", "title" => "Untitled Slide", "icon" => "{{Websites}}/img/icons/Websites/presentation", "content" => "", "deletable" => true)
	);
	
	$readLevel = Streams::$READ_LEVEL['messages'];
	$adminLevel = Streams::$ADMIN_LEVEL['own'];
	
	$rows = array();
	foreach ($streams as $streamName => $stream) {
		$publisherId = (substr($streamName, -1) == '/' ? '' : $userId);
		$level = !empty($stream['deletable']) ? 'close' : 'edit';
		$writeLevel = Streams::$WRITE_LEVEL[(!empty($stream['deletable'])) ? 'close' : 'edit'];
		$rows[] = @compact(
			'publisherId', 'streamName', 'ofUserId', 'ofContactLabel', 
			'grantedByUserId', 'readLevel', 'writeLevel', 'adminLevel'
		);
	}
	
	Streams_Access::insertManyAndExecute($rows);
	
	$attributes = null;
	$closedTime = null;
	$readLevel = Streams::$READ_LEVEL['messages'];
	$writeLevel = Streams::$WRITE_LEVEL['join'];
	$adminLevel = Streams::$ADMIN_LEVEL['invite'];
	$inheritAccess = null;
	
	$rows = array();
	foreach ($streams as $name => $s) {
		extract($s);
		$publisherId = (substr($name, -1) == '/' ? '' : $userId);
		$rows[] = @compact(
			'publisherId', 'name', 'type', 'title', 'icon', 'content', 'attributes',
			'readLevel', 'writeLevel', 'adminLevel', 'inheritAccess'
		);
	}
	
	Streams_Stream::insertManyAndExecute($rows);
	
	Streams_RelatedTo::insert(array(
		'toPublisherId' => '',
		'toStreamName' => 'Websites/presentation/',
		'type' => 'Websites/slides',
		'fromPublisherId' => '',
		'fromStreamName' => 'Websites/slide/'
	))->execute();
}

Websites_0_9_1_Streams_mysql();