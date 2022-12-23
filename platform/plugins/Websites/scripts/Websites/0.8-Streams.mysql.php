<?php

function Websites_0_8_Streams_mysql()
{
	// symlink the icons folder
	Q_Utils::symlink(
		WEBSITES_PLUGIN_FILES_DIR.DS.'Websites'.DS.'icons',
		WEBSITES_PLUGIN_WEB_DIR.DS.'img'.DS.'icons',
		true
	);
	
	$userId = Users::communityId();
	
	// $now = Streams::db()->toDateTime(Streams::db()->getCurrentTimestamp());
	
	$ofUserId = '';
	$ofContactLabel = 'Websites/admins';
	$grantedByUserId = null;
	
	$streams = array(
		"Streams/images/" => array('type' => "Streams/template", "title" => "Images", "icon" => "default", "content" => "", "deletable" => true),
		"Streams/image/" => array('type' => "Streams/template", "title" => "Untitled Image", "icon" => "Streams/image", "content" => "", "deletable" => true),
		"Streams/file/" => array('type' => "Streams/template", "title" => "Untitled File", "icon" => "files/_blank", "content" => "", "deletable" => true),
		"Websites/article/" => array('type' => "Streams/template", "title" => "Untitled Article", "icon" => "default", "content" => "", "deletable" => true),
		"Websites/metadata/" => array('type' => "Streams/template", "title" => "Website Metadata", "icon" => Q_Html::themedUrl("{{Websites}}/img/metadata"), "content" => "", "deletable" => true),
		"Websites/header" => array('type' => "Streams/image/icon", "title" => "Header image", "icon" => Q_Html::themedUrl("{{Websites}}/img/header"), "content" => ""),
		"Websites/slogan" => array('type' => "Streams/text/small", "title" => "Website slogan", "icon" => "default", "content" => "The coolest website"),
		"Websites/title" => array('type' => "Streams/text/small", "title" => "Website title", "icon" => "default", "content" => "Website Title"),
		"Websites/menu" => array('type' => "Streams/category", "title" => "Website Menu", "icon" => "default", "content" => ""),
		"Websites/articles" => array('type' => "Streams/category", "title" => "Articles", "icon" => "default", "content" => "Articles"),
		"Websites/images" => array('type' => "Streams/images", "title" => "Images", "icon" => "default", "content" => "Images"),
	);
	
	$readLevel = Streams::$READ_LEVEL['messages'];
	$adminLevel = Streams::$ADMIN_LEVEL['own'];
	
	$rows = array();
	foreach ($streams as $streamName => $stream) {
		$publisherId = (substr($streamName, -1) == '/' ? '' : $userId);
		$level = !empty($stream['deletable']) ? 'close' : 'edit';
		$writeLevel = Streams::$WRITE_LEVEL[$level];
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
		if (substr($name, 0, 9) != 'Websites/') {
			continue; // this tempate was already added by Streams install script
		}
		$publisherId = (substr($name, -1) == '/' ? '' : $userId);
		$rows[] = @compact(
			'publisherId', 'name', 'type', 'title', 'icon', 'content', 'attributes',
			'readLevel', 'writeLevel', 'adminLevel', 'inheritAccess'
		);
	}
	
	Streams_Stream::insertManyAndExecute($rows);
	
	Streams_RelatedTo::insert(array(
		'toPublisherId' => '',
		'toStreamName' => 'Streams/images/',
		'type' => 'Streams/images',
		'fromPublisherId' => '',
		'fromStreamName' => 'Streams/image/'
	))->execute();
	
	Streams_RelatedTo::insert(array(
		'toPublisherId' => '',
		'toStreamName' => 'Streams/category/',
		'type' => 'Websites/articles',
		'fromPublisherId' => '',
		'fromStreamName' => 'Websites/article/'
	))->execute();
	
	Streams_RelatedTo::insert(array(
		'toPublisherId' => '',
		'toStreamName' => 'Streams/category/',
		'type' => 'Websites/announcements',
		'fromPublisherId' => '',
		'fromStreamName' => 'Websites/article/'
	))->execute();
}

Websites_0_8_Streams_mysql();