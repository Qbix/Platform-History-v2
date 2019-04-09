<?php
	
function Websites_scrape_post($params)
{
	Q_Valid::nonce(true);

	$loggedUser = Users::loggedInUser(true);

	$r = array_merge($_REQUEST, $params);

	$fields = Q::take($r, array('url'));
	$url = $fields['url'];

	if (!filter_var($url, FILTER_VALIDATE_URL)) {
		throw new Exception("Invalid URL");
	}

	// get source with header
	$response = Q_Utils::get($url, $_SERVER['HTTP_USER_AGENT'], array(
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_VERBOSE => true,
		CURLOPT_HEADER => true
	));

	$response = explode("\r\n\r\n", $response);
	if (!is_array($response) || count($response) < 2) {
		throw new Exception("Server return wrong response!");
	}

	$headers = $response[count($response) - 2];
	$document = $response[count($response) - 1];

	if (!$document) {
		throw new Exception("Unable to access the site");
	}

	$doc = new DOMDocument();
	$doc->loadHTML($document);
	$xpath = new DOMXPath($doc);
	$query = $xpath->query('//*/meta');

	// get metas
	$ogMetas = array();
	$metas = array();
	foreach ($query as $item) {
		$name = $item->getAttribute('name');
		$content = $item->getAttribute('content');
		$property = $item->getAttribute('property');

		if(!empty($property) && preg_match('#^og:#', $property)) {
			$ogMetas[str_replace("og:", "", $property)] = $content;
		} elseif(!empty($name)) {
			$metas[$name] = $content;
		}
	}

	$result = array_merge($metas, $ogMetas);

	// split headers string into array
	$result['headers'] = array();
	$data = explode("\n", $headers);
	foreach ($data as $part) {
		$middle = explode(":",$part);
		$result['headers'][trim($middle[0])] = trim($middle[1]);
	}

	// collect language from diff mets
	$result['lang'] = Q::ifset($result, 'language', Q::ifset($result, 'lang', Q::ifset($result, 'locale', null)));

	// if language empty, collect from html tag or headers
	if (empty($result['lang'])) {
		// get title
		$html = $doc->getElementsByTagName("html");
		if($html->length > 0){
			$result['lang'] = $html->item(0)->getAttribute('lang');
		}

		if (empty($result['lang'])) {
			$result['lang'] = Q::ifset($result, 'headers', 'language', 'en');
		}
	}

	// get title
	$title = $doc->getElementsByTagName("title");
	if($title->length > 0){
		$result['title'] = $title->item(0)->nodeValue;
	}

	$query = $xpath->query('//*/link');
	$icons = array();
	$canonicalUrl = null;
	foreach ($query as $item) {
		$rel = $item->getAttribute('rel');
		$href = $item->getAttribute('href');

		if(!empty($rel)){
			if (preg_match('#icon#', $rel)) {
				$icons[$rel] = $href;
			}

			if ($rel == 'canonical') {
				$canonicalUrl = $href;
			}
		}
	}

	// parse url
	$result['url'] = $canonicalUrl ?: $url;

	// get icon
	$icon = Q::ifset($result, 'image', null);
	if ($icon) {
		$result['icon'] = $icon;
	} else {
		$result['icon'] = Q::ifset($icons, 'apple-touch-icon', Q::ifset($icons, 'image/png', Q::ifset($icons, 'image/gif', Q::ifset($icons, 'image/x-icon', null))));
	}

	// sometime icons url looks like '//cdn02...'
	if (preg_match("#^\/\/#", $result['icon'])) {
		$urlParsed = parse_url($result['url']);
		$result['icon'] = $urlParsed['scheme'].':'.$result['icon'];
	}

	// if requested slots publisherId and streamName - create stream
	if (Q_Request::slotName('publisherId') && Q_Request::slotName('streamName')) {
		Q::Event('Websites/webpage/post', $result);
	}

	Q_Response::setSlot('result', $result);
}