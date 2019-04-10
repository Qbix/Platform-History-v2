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
	$bigIcon = Q::ifset($r, 'bigIcon', null);
	$smallIcon = Q::ifset($r, 'smallIcon', null);
	$contentType = Q::ifset($r, 'headers', 'Content-Type', 'text/html'); // content type by default text/html
	$contentType = explode(';', $contentType)[0];
	$streamIcon = Q_Config::get('Streams', 'types', 'Websites/webpage', 'defaults', 'icon', null);

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

	$interestStream = Streams::fetchOne(null, $interestPublisherId, $interestStreamName);

	// set interest icon
	if ($interestStream instanceof Streams_Stream && !Users::isCustomIcon($interestStream->icon)) {
		$result = null;

		if (Q_Valid::url($smallIcon)) {
			$result = Users::importIcon($interestStream, array(
				'32.png' => $smallIcon
			), $interestStream->iconDirectory());
		}

		if (empty($result)) {
			$interestStream->icon = $streamIcon;
			$interestStream->setAttribute('iconSize', 40);
		} else {
			$interestStream->setAttribute('iconSize', 32);
		}

		$interestStream->save();
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
			'icon' => $bigIcon,
			'copyright' => $copyright,
			'contentType' =>$contentType,
			'lang' => Q::ifset($r, 'lang', 'en')
		)
	), array(
		'publisherId' => $interestPublisherId,
		'streamName' => $interestStreamName,
		'type' => 'Websites/webpage'
	));

	// set icon
	if (Q_Valid::url($bigIcon)) {
		$result = Users::importIcon($stream, Q_Image::iconArrayWithUrl($bigIcon, 'Streams/image'), $stream->iconDirectory());

		if (!empty($result)) {
			$stream->save();
		}
	}

	$stream->subscribe(compact('userId'));

	Q_Response::setSlot('publisherId', $stream->publisherId);
	Q_Response::setSlot('streamName', $stream->name);
}