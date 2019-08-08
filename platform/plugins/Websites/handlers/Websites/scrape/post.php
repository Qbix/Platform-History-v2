<?php
	
function Websites_scrape_post($params)
{
	// don't let just anyone call this, but only pages loaded from valid sessions
	Q_Valid::nonce(true);

	$r = array_merge($_REQUEST, $params);

	$fields = Q::take($r, array('url'));

	// if stream for this URL already exist, return it
	$streamExist = Websites_scrape_fetchStream($fields['url']);
	if ($streamExist) {
		return Q_Response::setSlot('result', $streamExist);
	}

	$result = Websites_Webpage::scrape($fields['url']);

	// if stream for this URL already exist, return it
	$streamExist = Websites_scrape_fetchStream($result['url']);
	if ($streamExist) {
		return Q_Response::setSlot('result', $streamExist);
	}

	// if requested slots publisherId and streamName - create stream
	if (Q_Request::slotName('publisherId') && Q_Request::slotName('streamName')) {
		Q::event('Websites/webpage/post', $result);
	}

	Q_Response::setSlot('result', $result);
}

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

	return array(
		'title' => $stream->title,
		'description' => $stream->content,
		'smallIcon' => $interestData['icon'],
		'host' => $stream->getAttribute('urlParsed')['host'],
		'bigIcon' => $stream->getAttribute('icon'),
		'url' => $stream->getAttribute('url'),
		'alreadyExist' => true
	);
}