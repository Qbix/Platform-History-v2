<?php
	
function Websites_webpage_post($params)
{
	Q_Valid::nonce(true);

	$userId = Q::ifset($params, 'userId', Users::loggedInUser(true)->id);

	$r = array_merge($_REQUEST, $params);

	$title = Q::ifset($r, 'title', null);
	if (!isset($title)) {
		throw new Q_Exception_RequiredField(array('field' => 'title'));
	}

	$url = Q::ifset($r, 'url', null);
	if (!filter_var($url, FILTER_VALIDATE_URL)) {
		throw new Exception("Invalid URL");
	}
	$urlParsed = parse_url($url);

	$description = Q::ifset($r, 'description', null);
	$copyright = Q::ifset($r, 'copyright', null);
	$icon = Q::ifset($r, 'icon', null);

	$interestTitle = 'Domains: '.$urlParsed['host'].($urlParsed['port'] ? ':'.$urlParsed['port'] : '');

	Q::Event('Streams/interest/post', array('title' => $interestTitle));
	$interestPublisherId = Q_Response::getSlot('publisherId');
	$interestStreamName = Q_Response::getSlot('streamName');

	$stream = Streams::create($userId, $userId, 'Websites/webpage', array(
		'title' => $title,
		'content' => $description,
		'attributes' => array(
			'url' => $url,
			'urlParsed' => $urlParsed,
			'interestTitle' => $interestTitle,
			'interest' => array(
				'publisherId' => $interestPublisherId,
				'streamName' => $interestStreamName,
			),
			'icon' => $icon,
			'copyright' => $copyright
		)
	), array(
		'publisherId' => $interestPublisherId,
		'streamName' => $interestStreamName,
		'type' => 'Websites/webpage'
	));

	Q_Response::setSlot('publisherId', $stream->publisherId);
	Q_Response::setSlot('streamName', $stream->name);
}