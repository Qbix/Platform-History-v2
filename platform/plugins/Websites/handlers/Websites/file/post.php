<?php
	
function Websites_file_post($params)
{
	// don't let just anyone call this, but only pages loaded from valid sessions
	Q_Valid::nonce(true);

    $params = array_merge($_REQUEST, $params);
	$fields = Q::take($params, array('url', 'publisherId', 'streamName', 'clipStart', 'clipEnd'));

	$url = $fields['url'];
	$publisherId = $fields['publisherId'];
	$streamName = $fields['streamName'];
	$clipStart = $fields['clipStart'];
	$clipEnd = $fields['clipEnd'];

	if ($publisherId && $streamName) {
		$stream = Streams_Stream::fetch(null, $publisherId, $streamName);
	} else {
		// stream required if publisherId and streamName slots requested
		$streamCreate = Q_Request::slotName("publisherId") && Q_Request::slotName("streamName");
	}

	if (parse_url($url, PHP_URL_SCHEME) === null) {
		$url = 'http://'.$url;
	}

	$result = Websites_File::scrape($url);

	if ($stream) {
		$stream = Websites_File::editStream(@compact("stream", "url", "clipStart", "clipEnd"));
	} elseif ($streamCreate) {
		$stream = Websites_File::createStream(@compact("url", "clipStart", "clipEnd"));
	}

	Q_Response::setSlot('publisherId', Q::ifset($stream, "publisherId", null));
	Q_Response::setSlot('streamName', Q::ifset($stream, "name", null));

	Q_Response::setSlot('result', $result);
}