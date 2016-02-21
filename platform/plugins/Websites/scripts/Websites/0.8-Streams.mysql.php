<?php

function Websites_0_8_Streams_mysql()
{
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
		"Websites/seo/" => array('type' => "Streams/template", "title" => "Website SEO", "icon" => Q_Html::themedUrl("plugins/Websites/img/seo"), "content" => "", "deletable" => true),
		"Websites/header" => array('type' => "Streams/image/icon", "title" => "Header image", "icon" => Q_Html::themedUrl("plugins/Websites/img/header"), "content" => ""),
		"Websites/slogan" => array('type' => "Streams/text/small", "title" => "Website slogan", "icon" => "default", "content" => "The coolest website"),
		"Websites/title" => array('type' => "Streams/text/small", "title" => "Website title", "icon" => "default", "content" => "Website Title"),
		"Websites/menu" => array('type' => "Streams/category", "title" => "Website Menu", "icon" => "default", "content" => ""),
		"Websites/articles" => array('type' => "Streams/category", "title" => "Articles", "icon" => "default", "content" => "Articles"),
		"Websites/images" => array('type' => "Streams/category", "title" => "Images", "icon" => "default", "content" => "Articles"),
	);
	
	$readLevel = Streams::$READ_LEVEL['messages'];
	$writeLevel = Streams::$WRITE_LEVEL['edit'];
	$adminLevel = Streams::$ADMIN_LEVEL['own'];
	
	$rows = array();
	foreach ($streams as $streamName => $stream) {
		$publisherId = (substr($streamName, -1) == '/' ? '' : $userId);
		$writeLevel = (!empty($stream['deletable'])) ? 40 : 30;
		$rows[] = compact(
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
		$rows[] = compact(
			'publisherId', 'name', 'type', 'title', 'icon', 'content', 'attributes',
			'readLevel', 'writeLevel', 'adminLevel', 'inheritAccess'
		);
	}
	
	Streams_Stream::insertManyAndExecute($rows);
	
	Streams_RelatedTo::insert(array(
		'toPublisherId' => '',
		'toStreamName' => 'Streams/images/',
		'type' => 'images',
		'fromPublisherId' => '',
		'fromStreamName' => 'Streams/image/'
	))->execute();
	
	Streams_RelatedTo::insert(array(
		'toPublisherId' => '',
		'toStreamName' => 'Streams/category/',
		'type' => 'articles',
		'fromPublisherId' => '',
		'fromStreamName' => 'Websites/article/'
	))->execute();
	
	Streams_RelatedTo::insert(array(
		'toPublisherId' => '',
		'toStreamName' => 'Streams/category/',
		'type' => 'announcements',
		'fromPublisherId' => '',
		'fromStreamName' => 'Websites/article/'
	))->execute();
}

Websites_0_8_Streams_mysql();