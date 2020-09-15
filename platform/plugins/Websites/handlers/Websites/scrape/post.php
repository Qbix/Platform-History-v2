<?php
	
function Websites_scrape_post($params)
{
	// don't let just anyone call this, but only pages loaded from valid sessions
	Q_Valid::nonce(true);

    $params = array_merge($_REQUEST, $params);

	$fields = Q::take($params, array('url', 'skipStream'));

	$url = $fields['url'];

	if (parse_url($url, PHP_URL_SCHEME) === null) {
		$url = 'http://'.$url;
	}

	$result = Websites_Webpage::scrape($url);

	// check if stream already exists
	$result["alreadyExist"] = (bool)Websites_Webpage::fetchStream($url);

	Q_Response::setSlot('result', $result);
}