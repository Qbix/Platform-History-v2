<?php
	
function Websites_scrape_response_data($params)
{
	Q_Valid::nonce(true);

	$loggedUser = Users::loggedInUser(true);

	$fields = Q::take($_REQUEST, array('url'));
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

	$res = array_merge($metas, $ogMetas);

	// get title
	$title = $doc->getElementsByTagName("title");
	if($title->length > 0){
		$res['title'] = $title->item(0)->nodeValue;
	}

	// get icon
	$icon = Q::ifset($res, 'image', null);
	if ($icon) {
		$res['icon'] = $icon;
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

		$res['icon'] = Q::ifset($icons, 'apple-touch-icon-precomposed', Q::ifset($icons, 'image/png', Q::ifset($icons, 'image/gif', Q::ifset($icons, 'image/x-icon', null))));
	}

	// parse url
	$res['url'] = parse_url($url);

	return $res;
}