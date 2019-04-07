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

	$document = file_get_contents($url);

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

	// get title
	$title = $doc->getElementsByTagName("title");
	if($title->length > 0){
		$result['title'] = $title->item(0)->nodeValue;
	}

	// get icon
	$icon = Q::ifset($result, 'image', null);
	if ($icon) {
		$result['icon'] = $icon;
	} else {
		$query = $xpath->query('//*/link');
		$icons = array();
		foreach ($query as $item) {
			$rel = $item->getAttribute('rel');
			$type = $item->getAttribute('type');
			$href = $item->getAttribute('href');

			if(!empty($rel) && preg_match('#icon#', $rel)) {
				$icons[$type] = $href;
			}
		}

		$result['icon'] = Q::ifset($icons, 'apple-touch-icon-precomposed', Q::ifset($icons, 'image/png', Q::ifset($icons, 'image/gif', Q::ifset($icons, 'image/x-icon', null))));
	}

	// parse url
	$result['url'] = $url;

	// if requested slots publisherId and streamName - create stream
	if (Q_Request::slotName('publisherId') && Q_Request::slotName('streamName')) {
		Q::Event('Websites/webpage/post', $result);
	}

	Q_Response::setSlot('result', $result);
}