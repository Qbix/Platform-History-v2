<?php
	
function Websites_scrape_post($params)
{
	// don't let just anyone call this, but only pages loaded from valid sessions
	Q_Valid::nonce(true);

    $params = array_merge($_REQUEST, $params);

	$fields = Q::take($params, array('url', 'skipStream'));

	$url = $fields['url'];

	// stream required if publisherId and streamName slots requested
	$streamRequired = Q_Request::slotName("publisherId") && Q_Request::slotName("streamName");

	if (parse_url($url, PHP_URL_SCHEME) === null) {
		$url = 'http://'.$url;
	}

	$result = Websites_Webpage::scrape($url);

	// check if stream already exists
	$stream = Websites_Webpage::fetchStream($url);

	if ($streamRequired && !$stream) {
		$stream = Websites_Webpage::createStream(compact("url"));
	}

	Q_Response::setSlot('publisherId', Q::ifset($stream, "publisherId", null));
	Q_Response::setSlot('streamName', Q::ifset($stream, "name", null));

	$result["alreadyExist"] = (bool)$stream;

	Q_Response::setSlot('result', $result);
}