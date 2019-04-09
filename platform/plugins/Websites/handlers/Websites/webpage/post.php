<?php
	
function Websites_webpage_post($params)
{
	Q_Valid::nonce(true);

	$userId = Q::ifset($params, 'userId', Users::loggedInUser(true)->id);

	$r = array_merge($_REQUEST, $params);

	$url = Q::ifset($r, 'url', null);
	if (!filter_var($url, FILTER_VALIDATE_URL)) {
		throw new Exception("Invalid URL");
	}
	$urlParsed = parse_url($url);

	$title = Q::ifset($r, 'title', substr($url, strrpos($url, '/') + 1));
	$title = $title ?: null;

	$description = Q::ifset($r, 'description', null);
	$copyright = Q::ifset($r, 'copyright', null);
	$icon = Q::ifset($r, 'icon', null);
	$contentType = Q::ifset($r, 'headers', 'Content-Type', 'text/html'); // content type by default text/html
	$contentType = explode(';', $contentType)[0];
	$streamIcon = null;

	if ($contentType != 'text/html') {
		// trying to get icon
		Q_Config::load(WEBSITES_PLUGIN_CONFIG_DIR.DS.'mime-types.json');
		$extension = Q_Config::get('mime-types', $contentType, '_blank');
		$urlPrefix = Q_Request::baseUrl().'/{{Streams}}/img/icons/files';
		$streamIcon = file_exists(STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons'.DS.'files'.DS.$extension)
			? "$urlPrefix/$extension"
			: "$urlPrefix/_blank";
	}

	$interestTitle = 'Websites: '.$urlParsed['host'].($urlParsed['port'] ? ':'.$urlParsed['port'] : '');

	Q::Event('Streams/interest/post', array('title' => $interestTitle));
	$interestPublisherId = Q_Response::getSlot('publisherId');
	$interestStreamName = Q_Response::getSlot('streamName');

	// icon
	if (Q_Valid::url($icon)) {
		$iconList = Q_Image::iconArrayWithUrl($icon, 'Streams/image');
	}

	$stream = Streams::create($userId, $userId, 'Websites/webpage', array(
		'title' => $title,
		'content' => $description,
		'icon' => $streamIcon,
		'attributes' => array(
			'url' => $url,
			'urlParsed' => $urlParsed,
			'interestTitle' => $interestTitle,
			'interest' => array(
				'publisherId' => $interestPublisherId,
				'streamName' => $interestStreamName,
			),
			'icon' => $icon,
			'copyright' => $copyright,
			'contentType' =>$contentType,
			'lang' => Q::ifset($r, 'lang', 'en')
		)
	), array(
		'publisherId' => $interestPublisherId,
		'streamName' => $interestStreamName,
		'type' => 'Websites/webpage'
	));

	$stream->subscribe(compact('userId'));

	Q_Response::setSlot('publisherId', $stream->publisherId);
	Q_Response::setSlot('streamName', $stream->name);
}