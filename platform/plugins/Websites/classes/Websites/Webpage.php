<?php
/**
 * @module Websites
 */
/**
 * Class for dealing with websites webpage
 * 
 * @class Websites_Webpage
 */
class Websites_Webpage
{
	/**
	 * Get URL, load page and crape info to array
	 * @method scrape
	 * @static
	 * @param string $url Page source to load
	 * @throws Exception
	 * @return array
	 */
	static function scrape($url)
	{
		if (!Q_Valid::url($url)) {
			throw new Exception("Invalid URL");
		}

		$parsedUrl = parse_url($url);

		// get source with header
		// "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36"
		/*$response = Q_Utils::get($url, $_SERVER['HTTP_USER_AGENT'], array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_VERBOSE => true,
			CURLOPT_HEADER => true
		));
		$response = explode("\r\n\r\n", $response);
		if (!is_array($response) || count($response) < 2) {
			throw new Exception("Server return wrong response!");
		}
		$headers = $document = '';
		foreach ($response as $i => $item) {
			if (strpos($item, 'HTTP/') === 0 && empty($document)) {
				$headers = $item;
			} else {
				$document .= $item;
			}
		}*/


		$document = file_get_contents($url);
		$headers = $http_response_header;

		if (!$document) {
			throw new Exception("Unable to access the site");
		}

		$doc = new DOMDocument();
		// set error level
		$internalErrors = libxml_use_internal_errors(true);
		$doc->loadHTML(mb_convert_encoding($document, 'HTML-ENTITIES', 'UTF-8'));
		// Restore error level
		libxml_use_internal_errors($internalErrors);

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
		if (is_string($headers)) {
			$data = explode("\n", $headers);
		} else {
			$data = $headers;
		}
		foreach ($data as $part) {
			$middle = explode(":",$part);
			$result['headers'][trim($middle[0])] = trim(Q::ifset($middle, 1, null));
		}

		// collect language from diff metas
		$result['lang'] = Q::ifset($result, 'language', Q::ifset($result, 'lang', Q::ifset($result, 'locale', null)));

		// if language empty, collect from html tag or headers
		if (empty($result['lang'])) {
			// get title
			$html = $doc->getElementsByTagName("html");
			if($html->length > 0){
				$result['lang'] = $html->item(0)->getAttribute('lang');
			}

			if (empty($result['lang'])) {
				$result['lang'] = Q::ifset($result, 'headers', 'language', Q::ifset($result, 'headers', 'content-language', 'en'));
			}
		}

		// get title
		$result['title'] = $xpath->query('//title')->item(0)->textContent;

		$query = $xpath->query('//*/link');
		$icons = array();
		$canonicalUrl = null;
		foreach ($query as $item) {
			$rel = $item->getAttribute('rel');
			$href = $item->getAttribute('href');

			if(!empty($rel)){
				if (preg_match('#icon#', $rel)) {
					$icons[$rel] = self::normalizeHref($href, $url);
				}

				if ($rel == 'canonical') {
					$canonicalUrl = self::normalizeHref($href, $url);
				}
			}
		}

		// parse url
		$result['url'] = $canonicalUrl ?: $url;

		// get icon
		$icon = Q::ifset($result, 'image', null);
		if (Q_Valid::url($icon)) {
			$result['bigIcon'] = $icon;
		} else {
			$result['bigIcon'] = Q::ifset($icons, 'apple-touch-icon', Q::ifset($icons, 'apple-touch-icon-precomposed', Q::ifset($icons, 'icon', null)));
		}

		$result['smallIcon'] = Q::ifset($icons, 'icon', Q::ifset($icons, 'shortcut icon', $result['bigIcon']));

		// if big icon empty, set it to small icon
		if (empty($result['bigIcon']) && !empty($result['smallIcon'])) {
			$result['bigIcon'] = $result['smallIcon'];
		}

		// additional handler for youtube.com
		if ($parsedUrl['host'] == 'www.youtube.com') {
			$googleapisKey = Q_Config::expect('Websites', 'youtube', 'keys', 'server');
			preg_match("#(?<=v=)[a-zA-Z0-9-]+(?=&)|(?<=v\/)[^&\n]+(?=\?)|(?<=v=)[^&\n]+|(?<=youtu.be/)[^&\n]+#", $url, $googleapisMatches);
			$googleapisUrl = sprintf('https://www.googleapis.com/youtube/v3/videos?id=%s&key=%s&fields=items(snippet(title,description,tags,thumbnails))&part=snippet', reset($googleapisMatches), $googleapisKey);
			$googleapisRes = json_decode(Q_Utils::get($googleapisUrl));
			// if json is valid
			if (json_last_error() == JSON_ERROR_NONE) {
				if ($googleapisSnippet = Q::ifset($googleapisRes, 'items', 0, 'snippet', null)) {
					$result['title'] = Q::ifset($googleapisSnippet, 'title', Q::ifset($result, 'title', null));
					$result['description'] = Q::ifset($googleapisSnippet, 'description', Q::ifset($result, 'description', null));
					$result['bigIcon'] = Q::ifset($googleapisSnippet, 'thumbnails', 'high', 'url', Q::ifset($googleapisSnippet, 'thumbnails', 'medium', 'url', Q::ifset($googleapisSnippet, 'thumbnails', 'default', 'url', Q::ifset($result, 'bigIcon', null))));

					$googleapisTags = Q::ifset($googleapisSnippet, 'tags', null);
					if (is_array($googleapisTags) && count($googleapisTags)) {
						$result['keywords'] = implode(',', $googleapisTags);
					}
				}
			}
		}

		return $result;
	}
	/**
	 * Normalize href like '//path/to' or '/path/to' to valid URL
	 * @method normalizeHref
	 * @static
	 * @param string $href
	 * @param string $baseUrl
	 * @throws Exception
	 * @return string
	 */
	static function normalizeHref ($href, $baseUrl) {
		$parts = parse_url($baseUrl);

		if (preg_match("#^\/\/#", $href)) {
			return $parts['scheme'].':'.$href;
		}

		if (preg_match("#^\/#", $href)) {
			return $parts['scheme'] . '://' . $parts['host'] . $href;
		}

		return $href;
	}
	/**
	 * Normalize url to use as part of stream name like Websites/webpage/[normalized]
	 * @method normalizeUrl
	 * @static
	 * @param {string} $url
	 * @return string
	 */
	static function normalizeUrl($url) {
		// we have "name" field max size 255, Websites/webpage/ = 18 chars
		return substr(Q_Utils::normalize($url), 0, 230);
	}
	/**
	 * If Websites/webpage stream for this $url already exists - return one.
	 * @method fetchStream
	 * @static
	 * @param {string} $publisherId
	 * @param {string} $url
	 * @return Streams_Stream
	 */
	static function fetchStream($publisherId, $url) {
		return Streams::fetchOne($publisherId, $publisherId, "Websites/webpage/".self::normalizeUrl($url));
	}
		/**
	 * Create Websites/webpage stream from params
	 * @method createStream
	 * @static
	 * @param string $publisherId
	 * @param array $params
	 * @throws Exception
	 * @return Streams_Stream
	 */
	static function createStream ($publisherId, $params) {
		$url = Q::ifset($params, 'url', null);
		if (!Q_Valid::url($url)) {
			throw new Exception("Invalid URL");
		}
		$urlParsed = parse_url($url);

		$userId = $publisherId ?: Users::loggedInUser(true)->id;

		$title = Q::ifset($params, 'title', substr($url, strrpos($url, '/') + 1));
		if ($title) {
			$title = substr(Q::ifset($params, 'title', ''), 0, 255);
		} else {
			$title = $title ?: '';
		}

		$keywords = Q::ifset($params, 'keywords', null);
		$description = substr(Q::ifset($params, 'description', ''), 0, 1023);
		$copyright = Q::ifset($params, 'copyright', null);
		$bigIcon = self::normalizeHref(Q::ifset($params, 'bigIcon', null), $url);
		$smallIcon = self::normalizeHref(Q::ifset($params, 'smallIcon', null), $url);
		$contentType = Q::ifset($params, 'headers', 'Content-Type', 'text/html'); // content type by default text/html
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

		// special interest stream for websites/webpage stream
		$port = Q::ifset($urlParsed, 'port', null);
		$interestTitle = 'Websites: '.$urlParsed['host'].($port ? ':'.$port : '');
		// insofar as user created Websites/webpage stream, need to complete all actions related to interest created from client
		Q::event('Streams/interest/post', array(
			'title' => $interestTitle,
			'userId' => $userId
		));
		$interestPublisherId = Q_Response::getSlot('publisherId');
		$interestStreamName = Q_Response::getSlot('streamName');

		$interestStream = Streams::fetchOne(null, $interestPublisherId, $interestStreamName);

		// set icon for interest stream
		if ($interestStream instanceof Streams_Stream && !Users::isCustomIcon($interestStream->icon)) {
			$result = null;

			if (Q_Valid::url($smallIcon)) {
				try {
					$result = Users::importIcon($interestStream, array(
						'32.png' => $smallIcon
					), $interestStream->iconDirectory());
				} catch (Exception $e) {

				}
			}

			if (empty($result)) {
				$interestStream->icon = $streamIcon;
				$interestStream->setAttribute('iconSize', 40);
			} else {
				$interestStream->setAttribute('iconSize', 32);
			}

			$interestStream->save();
		}

		// check if stream for this url has been already created
		// and if yes, return it
		if ($webpageStream = self::fetchStream($userId, $url)) {
			return $webpageStream;
		}

		$webpageStream = Streams::create($userId, $userId, 'Websites/webpage', array(
			'title' => trim($title),
			'content' => trim($description) ?: "",
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
				'lang' => Q::ifset($params, 'lang', 'en')
			),
			'skipAccess' => true,
			'name' => "Websites/webpage/".self::normalizeUrl($url)
		), array(
			'publisherId' => $interestPublisherId,
			'streamName' => $interestStreamName,
			'type' => 'Websites/webpage'
		));

		// set custom icon for Websites/webpage stream
		if (Q_Valid::url($bigIcon)) {
			try {
				$result = Users::importIcon($webpageStream, Q_Image::iconArrayWithUrl($bigIcon, 'Streams/image'), $webpageStream->iconDirectory());
				if (!empty($result)) {
					$webpageStream->save();
				}
			} catch (Exception $e) {

			}
		}

		$webpageStream->subscribe(compact('userId'));

		// handle with keywords
		if (!empty($keywords)) {
			$delimiter = preg_match("/,/", $keywords) ? ',' : ' ';
			foreach (explode($delimiter, $keywords) as $keyword) {
				$keywordInterestStream = Streams::getInterest($keyword);
				if ($keywordInterestStream instanceof Streams_Stream) {
					$webpageStream->relateTo($keywordInterestStream, $webpageStream->type, $webpageStream->publisherId, array(
						'skipAccess' => true
					));
				}
			}
		}

		return $webpageStream;
	}
}
