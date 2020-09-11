<?php
	
function Websites_scrape_post($params)
{
	// don't let just anyone call this, but only pages loaded from valid sessions
	Q_Valid::nonce(true);

    $params = array_merge($_REQUEST, $params);

	$fields = Q::take($params, array('url', 'skipStream'));

	$url = $fields['url'];
	$withStream = (bool)$fields['withStream'];

	if (parse_url($url, PHP_URL_SCHEME) === null) {
		$url = 'http://'.$url;
	}

	$result = Websites_Webpage::scrape($url);

	if ($withStream) {
		// if stream for this URL already exist, return it
		$stream = Websites_scrape_fetchStream($result['url']);
		if (!$stream) {
			$stream = Q::event('Websites/webpage/post', $result);
		}

		$result['publisherId'] = $stream->publisherId;
		$result['streamName'] = $stream->name;
		Q_Response::setSlot('stream', $stream);
    } else {
		$result['publisherId'] = null;
		$result['streamName'] = null;
	}

	Q_Response::setSlot('result', $result);
}

/**
 * Along with getting stream, this method get small icon from interest
 * @method Websites_scrape_fetchStream
 * @static
 * @param string $url
 * @return array
 */
function Websites_scrape_fetchStream($url) {
	// if stream for this URL already exist, return it
	$stream = Websites_Webpage::fetchStream($url);
	if (!$stream) {
		return null;
	}

	$interest = $stream->getAttribute('interest');
	$interestPublisherId = Q::ifset($interest, 'publisherId', null);
	$interestStreamName = Q::ifset($interest, 'streamName', null);
	$interestData = array(
		'title' => null,
		'icon' => null
	);
	if ($interestPublisherId && $interestStreamName) {
		$interest = Streams::fetchOne($interestPublisherId, $interestPublisherId, $interestStreamName);

		if ($interest) {
			$interestData['title'] = $interest->title;
			$interestData['icon'] = $interest->iconUrl($interest->getAttribute('iconSize'));
		}
	}

    Q_Response::setSlot('stream', $stream);
	Q_Response::setSlot('publisherId', $stream->publisherId);
	Q_Response::setSlot('streamName', $stream->name);

	return array(
		'title' => $stream->title,
		'description' => $stream->content,
		'smallIcon' => $interestData['icon'],
		'host' => $stream->getAttribute('urlParsed')['host'],
		'iconBig' => $stream->getAttribute('iconBig'),
		'url' => $stream->getAttribute('url'),
		'alreadyExist' => true
	);
}