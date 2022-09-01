<?php
/**
 * @module Websites
 */
/**
 * Class for dealing with websites webpage
 * 
 * @class Websites_Webpage
 */
class Websites_Webpage extends Base_Websites_Webpage
{
	/**
	 * Get URL, load page and crape info to array
	 * @method scrape
	 * @static
	 * @param string $url Page source to load
	 * @throws Q_Exception
	 * @return array
	 */
	static function scrape($url)
	{
		$parts = explode('#', $url);
		$url = reset($parts);
		$originalUrl = $url;

		// add scheme to url if not exist
		if (parse_url($url, PHP_URL_SCHEME) === null) {
			$url = 'http://'.$url;
		}

		if (!Q_Valid::url($url)) {
			throw new Exception("Invalid URL");
		}

		$parsedUrl = parse_url($url);
		$host = $parsedUrl["host"];
		$port = Q::ifset($parsedUrl, "port", null);

		$result = array(
			'host' => $host,
			'port' => $port
		);

		//$document = file_get_contents($url);

        // try to get cache
		$cached = self::cacheGet($originalUrl);
		if (!$cached) {
			if (substr($url, -1) === '/') {
				$cached = self::cacheGet(substr($originalUrl, 0, -1));
			} else {
				$cached = self::cacheGet($originalUrl.'/');
			}
		}
		if ($cached) {
			return $cached;
		}

		$headers = get_headers($url, 1);
		for ($i=0; $i<5; ++$i) {
			if ($header = Q::ifset($headers, 0, '')
			and preg_match('/HTTP.*\ 301/', $header)) {
				// Do up to 5 redirects
				if (empty($headers['Location'])) {
					throw new Q_Exception("Redirect to empty location");
				}
				$url = self::normalizeHref(
					is_array($headers['Location'])
						? end($headers['Location'])
						: $headers['Location'],
					$url
				);
				$headers = get_headers($url, 1);
			} else {
				break;
			}
		}
		$headers = array_change_key_case($headers, CASE_LOWER);
        if (is_array($headers['content-type'])) {
            $contentType = end($headers['content-type']);
        } else {
            $contentType = $headers['content-type'];
        }

        // for non text/html content use another approach
        if (!stristr($contentType, 'text/html')) {
            $fileInfo = self::getRemoteFileInfo($url);

            $extension = Q::ifset($fileInfo, 'fileformat', Q::ifset($fileInfo, 'mime_type', strtolower(pathinfo($url, PATHINFO_EXTENSION))));
            $extension = preg_replace("/.*\//", '', $extension);

            // check if this extension exist in Streams/files/Streams/icons/files
            $dirname = STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons'.DS.'files';
            $urlPrefix = '{{Streams}}/img/icons/files';
            $icon = file_exists($dirname.DS.$extension)
                ? "$urlPrefix/$extension/80.png"
                : "$urlPrefix/_blank/80.png";


            $result = array_merge($result, array(
                'title' => Q::ifset($fileInfo, 'comments', 'name', null),
                'url' => $url,
                'iconBig' => $icon,
                'iconSmall' => $icon,
                'type' => $extension
            ));

            return self::_returnScrape($originalUrl, $url, $result);
        }

		// If http response header mentions that content is gzipped, then uncompress it
		$gzip = false;
		foreach ($http_response_header as $item) {
			if(stristr($item, 'content-encoding') && stristr($item, 'gzip')) {
				//Now lets uncompress the compressed data
				$gzip = true;
				$document = file_get_contents($url);
				$document = gzinflate(substr($document,10,-8) );
				break;
			}
		}
		if (!$gzip) {
			$document = self::readURL($url);
			if (!$document) {
				throw new Exception("Unable to access the site");
			}
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

		$result = array_merge($result, $metas, $ogMetas);

		$result['headers'] = array();

		// merge headers into string
		foreach ($headers as $key => $item) {
			if (is_array($item)) {
				$item = end($item);
			}
			$result['headers'][trim($key)] = trim($item);
		}

		// collect language from diff metas
		$result['lang'] = Q::ifset($result, 'language', Q::ifset(
			$result, 'lang', Q::ifset($result, 'locale', null)
		));

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

		$elements = $xpath->query('//*/link');
		$icons = array();
		$canonicalUrl = null;
		foreach ($elements as $element) {
			$rel = strtolower($element->getAttribute('rel'));
			$href = $element->getAttribute('href');

			if(!empty($rel)){
				if (preg_match('#icon#', $rel)) {
					$icons[$rel] = self::normalizeHref($href, $url);
				}

				if ($rel == 'canonical') {
					$canonicalUrl = self::normalizeHref($href, $url);
				}
			}
		}

		$elements = $xpath->query('//*/meta');
		foreach ($elements as $element) {
			$itemprop = strtolower($element->getAttribute('itemprop'));
			$metaname = strtolower($element->getAttribute('name'));
			if ($itemprop === 'image'
			or strpos($metaname, ':image') !== false) {
				$href = $element->getAttribute('content');
				if (!$href) {
					$href = $element->getAttribute('value');
				}
				$items['image'] = self::normalizeHref($href, $url);
			}
		}

		// parse url
		$result['url'] = $canonicalUrl ? $canonicalUrl : $url;

		// get big icon
		$icon = Q::ifset($result, 'image', null);
		$bigIconAllowedMetas = array( // search icon among <link> with these "rel"
			'apple-touch-icon',
			'apple-touch-icon-precomposed',
			'image'
		);
		if (Q_Valid::url($icon)) {
			$result['iconBig'] = $icon;
		} else {
			foreach ($bigIconAllowedMetas as $item) {
				if ($item = Q::ifset($icons, $item, null)) {
					$result['iconBig'] = $item;
					break;
				}
			}
		}

		// get small icon
		$result['iconSmall'] = $result['iconBig']; // default
		$smallIconAllowedMetas = array( // search icon among <link> with these "rel"
			'icon',
			'shortcut icon'
		);
		foreach ($smallIconAllowedMetas as $item) {
			if ($item = Q::ifset($icons, $item, null)) {
				$result['iconSmall'] = $item;
				break;
			}
		}

		// as we don't support SVG images in Users::importIcon, try to select another image
		// when we start support SVG, just remove these blocks
		if (!empty($result['iconBig'])
		and pathinfo($result['iconBig'], PATHINFO_EXTENSION) == 'svg') {
			reset($bigIconAllowedMetas);
			foreach ($bigIconAllowedMetas as $item) {
				$item = Q::ifset($icons, $item, null);
				if ($item && pathinfo($item, PATHINFO_EXTENSION) != 'svg') {
					$result['iconBig'] = $item;
					break;
				}
			}
		}
		if (!empty($result['iconSmall'])
		and pathinfo($result['iconSmall'], PATHINFO_EXTENSION) == 'svg') {
			reset($smallIconAllowedMetas);
			foreach ($smallIconAllowedMetas as $item) {
				$item = Q::ifset($icons, $item, null);
				if ($item && pathinfo($item, PATHINFO_EXTENSION) != 'svg') {
					$result['iconSmall'] = $item;
					break;
				}
			}
		}
		//---------------------------------------------------------------

		// if big icon empty, set it to small icon
		if (empty($result['iconBig']) && !empty($result['iconSmall'])) {
			$result['iconBig'] = $result['iconSmall'];
		}

		$result['iconBig'] = self::normalizeHref($result['iconBig'], $url);
		$result['iconSmall'] = self::normalizeHref($result['iconSmall'], $url);

		// additional handler for youtube.com
		if (in_array($host, array('www.youtube.com', 'youtube.com'))) {
			preg_match("#(?<=v=)[a-zA-Z0-9-]+(?=&)|(?<=v\\/)[^&\n]+(?=\\?)|(?<=v=)[^&\n]+|(?<=youtu.be/)[^&\n]+#", $url, $videoId);
			$videoId = reset($videoId);
			$youtubeData = self::youtube(@compact("videoId"));
			$youtubeData  = reset($youtubeData);
			$result = array_merge($result, $youtubeData);
		}

		$result['iconBig'] = Q::ifset($result, 'iconBig', Q_Uri::interpolateUrl("{{baseUrl}}/{{Websites}}/img/icons/Websites/webpage/80.png"));
		$result['iconSmall'] = Q::ifset($result, 'iconSmall', Q_Uri::interpolateUrl("{{baseUrl}}/{{Websites}}/img/icons/Websites/webpage/40.png"));

		return self::_returnScrape($originalUrl, $url, $result);
	}

	private static function _returnScrape ($originalUrl, $url, $result) {
		Websites_Webpage::cacheSet($originalUrl, $result);
		if ($url !== $originalUrl) {
			Websites_Webpage::cacheSet($url, $result);
		}
		return $result;
	}

	/**
	 * Get search youtube videos or get info about video.
	 * @method youtube
	 * @static
	 * @param {array} $options
	 * @param {string} [$options.videoId] id of youtube video to get info about single video
	 * @param {string|array} [$options.query] If string - query string to search videos. If array - replace ytQuery object.
	 * @param {string} [$options.channel] youtube channel id
	 * @param {integer} [$options.maxResults=10] limit search results
	 * @param {string} [$options.order=date] Results order by.
	 * @param {boolean} [$options.pureResult=false] If true, return exactly result got from youtube API
	 * @param {integer} [$options.cacheDuration] response cache life time in seconds
	 * @return {array|boolean} decoded json if found or false
	 */
	static function youtube ($options) {
		$apiKey = Q_Config::expect("Websites", "youtube", "keys", "server");
		$videoId = Q::ifset($options, "videoId", null);
		$query = Q::ifset($options, "query", null);
		$pureResult = Q::ifset($options, "pureResult", false);

		if ($videoId === null && $query === null) {
			throw new Exception('Websites_Webpage::youtube: videoId or query should defined');
		}

		$type = $videoId ? "videos" : "search";
		$endPoint = "https://youtube.googleapis.com/youtube/v3/".$type;

		$ytQuery = is_array($query) ? $query : array(
			"part" => "snippet"
		);

		if ($type == "search") {
			$ytQuery["maxResults"] = Q::ifset($options, "maxResults", 10);
			$ytQuery["order"] = Q::ifset($options, "order", "date");
			if (is_string($query)) {
				$ytQuery["q"] = $query;
			}

			$channelId = Q::ifset($options, "channel", null);
			if ($channelId) {
				$ytQuery["channelId"] = $channelId;
			}
		} elseif ($type == "videos") {
			$ytQuery["id"] = $videoId;
		}

		if (!function_exists('returnYoutube')) {
			function returnYoutube ($data, $pureResult) {

				if ($pureResult) {
					return $data;
				}

				$results = array();

				foreach ($data["items"] as $item) {
					$snippet = $item["snippet"];

					$tags = Q::ifset($snippet, 'tags', null);
					$keywords = "";
					if (is_array($tags) && count($tags)) {
						$keywords = implode(',', $tags);
					}

					$result = array(
						"title" => $snippet["title"],
						"icon" => Q::ifset($snippet, "thumbnails", "default", "url", null),
						"iconBig" => Q::ifset($snippet, "thumbnails", "high", "url", null),
						"iconSmall" => "{{Websites}}/img/icons/Websites/youtube/32.png",
						"description" => $snippet["description"],
						"keywords" => $keywords,
						"publishTime" => strtotime(Q::ifset($snippet, "publishTime", Q::ifset($snippet, "publishedAt", "now"))),
						"url" => "https://www.youtube.com/watch?v=".Q::ifset($item, "id", "videoId", Q::ifset($item, "id", null))
					);

					// cache data for video
					Websites_Webpage::cacheSet($result["url"], $result);

					$results[] = $result;
				}

				return $results;
			}
		}

		$cacheUrl = $endPoint.'?'.http_build_query($ytQuery);

		// check for cache
		$cached = Websites_Webpage::cacheGet($cacheUrl);
		if ($cached) {
			return returnYoutube($cached, $pureResult);
		}

		$ytQuery["key"] = $apiKey;

		// docs: https://developers.google.com/youtube/v3/docs/search/list
		$youtubeApiUrl = $endPoint.'?'.http_build_query($ytQuery);
		$result = Q::json_decode(Q_Utils::get($youtubeApiUrl), true);
		$cacheDuration = $type == "search" ? Q::ifset($options, "cacheDuration", Q_Config::get("Websites", "youtube", "list", "cacheDuration", 43200)) : null; // for youtube search results cache duration 12 hours
		Websites_Webpage::cacheSet($cacheUrl, $result, $cacheDuration);

		return returnYoutube($result, $pureResult);
	}
	/**
	 * Get cached url response
	 * @method cacheGet
	 * @static
	 * @param string $url
	 * @return array|boolean decoded json if found or false
	 */
	static function cacheGet ($url) {
		if (!Q_Config::get('Websites', 'cache', 'webpage', true)) {
			return false;
		}

		$webpageCahe = new Websites_Webpage();
		$webpageCahe->url = $url;
		if (!$webpageCahe->retrieve()) {
			// if not retrieved try to find url ended with slash (to avoid duplicates of save source)
			$webpageCahe->url = $url.'/';
			$webpageCahe->retrieve();
		}

		if ($webpageCahe->retrieved) {
			$updatedTime = $webpageCahe->updatedTime;
			if (isset($updatedTime)) {
				$db = $webpageCahe->db();
				$updatedTime = $db->fromDateTime($updatedTime);
				$currentTime = $db->getCurrentTimestamp();
				$cacheDuration = $webpageCahe->duration; // default 1 month
				if ($currentTime - $updatedTime < $cacheDuration) {
					// there are cached webpage results that are still viable
					return json_decode($webpageCahe->results, true);
				} else {
					$webpageCahe->remove();
				}
			}
		}

		return false;
	}
	/**
	 * Save url response to cache
	 * @method cacheSet
	 * @static
	 * @param string $url
	 * @param array $result
	 * @param integer [$duration=null] cache life time in seconds
	 */
	static function cacheSet ($url, $result, $duration = null) {
		// check if already exists
		if (self::cacheGet($url)) {
			return;
		}

		$webpageCahe = new Websites_Webpage();
		$webpageCahe->url = $url;

		if ($duration) {
			$webpageCahe->duration = $duration;
		}

		// dummy interest block for cache
		$result['interest'] = array(
			'title' => $url,
			'icon' => Q::ifset($result, "iconSmall", Q::ifset($result, "icon", Q::ifset($result, "iconBig", null)))
		);
		$webpageCahe->results = json_encode($result);
		$webpageCahe->save();
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

		if (preg_match("#^\\/\\/#", $href)) {
			return $parts['scheme'].':'.$href;
		}

		if (preg_match("#^\\/#", $href)) {
			return $parts['scheme'] . '://' . $parts['host'] . $href;
		}

		if (!Q_Valid::url($href)) {
			return $parts['scheme'] . '://' . $parts['host'] . '/' . $href;
		}

		if (substr($baseUrl, -1) === '/') {
			$baseUrl = substr($baseUrl, 0, -1);
		}
		if (preg_match("#^.\\/#", $href)) {
			return $baseUrl . '/' . substr($href, 2);
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
	 * @param {string} $url URL string to search stream by.
     * @param {string} [$streamType=null] Type of stream to search. If null it auto detected with getStreamType method.
	 * @return Streams_Stream
	 */
	static function fetchStream($url, $streamType = null) {
        if (!$streamType) {
            $streamType = self::getStreamType($url);
        }

		$streams = new Streams_Stream();
		$streams->name = $streamType.'/'.self::normalizeUrl($url);
		if ($streams->retrieve()) {
			return Streams_Stream::fetch($streams->publisherId, $streams->publisherId, $streams->name);
		}

		$streams->name .= '_';
		if ($streams->retrieve()) {
			return Streams_Stream::fetch($streams->publisherId, $streams->publisherId, $streams->name);
		}

		return null;
	}
    /**
     * Get stream type from url
     * @method getType
     * @static
     * @param {string} $url
     * @return String
     */
	static function getStreamType ($url) {
        $parsed = parse_url($url);
        $host = Q::ifset($parsed, 'host', null);

        $path_info = pathinfo($url);
        $extension = Q::ifset($path_info, 'extension', '');

        $videoHosts = Q_Config::get("Websites", "videoHosts", array());
        $videoExtensions = Q_Config::get("Websites", "videoExtensions", array());

        $audioHosts = Q_Config::get("Websites", "audioHosts", array());
        $audioExtensions = Q_Config::get("Websites", "audioExtensions", array());

        if (false !== Q::striposa($host, $videoHosts) || false !== Q::striposa($extension, $videoExtensions)) {
            return 'Streams/video';
        } elseif (false !== Q::striposa($host, $audioHosts) || false !== Q::striposa($extension, $audioExtensions)) {
            return 'Streams/audio';
        }

        return 'Websites/webpage';
    }
	/**
	 * Get limited data from remote url
	 * @method readURL
	 * @static
	 * @param {string} $url
	 * @param {integer} [$dataLimit=65536] Limit data length (bites) to download. Default 64Kb.
	 * @throws Q_Exception
	 * @return string
	 */
	static function readURL ($url, $dataLimit = 65536) {
		if (!$urlp = fopen($url, "r")) {
			throw new Q_Exception('Error opening URL for reading');
		}

		$data = null;

		try {
			$chunk_size = 4096; // Haven't bothered to tune this, maybe other values would work better??
			$got = 0;

			// Grab the first 64 KB of the file	
			while(!feof($urlp) && $got < $dataLimit) {
				$data = $data . fgets($urlp, $chunk_size);
				$got = strlen($data);
			}

			// Now $fp should be the first and last 64KB of the file!!
			@fclose($urlp);
		} catch (Exception $e) {
			@fclose($urlp);
			throw new Q_Exception('Error reading remote file using fopen');
		}

		return $data;
	}
    /**
     * Get meta data from remote file by url
     * @method getRemoteFileInfo
     * @static
     * @param {string} $url
     * @param {integer} [$dataLimit=65536] Limit data length (bites) to download. Default 64Kb.
	 * @param {boolean} [$closeFile=true] Whether to remove temp file after method executed
     * @throws Q_Exception
     * @return array
     */
    static function getRemoteFileInfo ($url, $dataLimit = 65536, $closeFile = true) {
        if (!$urlp = fopen($url, "r")) {
            throw new Q_Exception('Error opening URL for reading');
        }
        $file = tmpfile();
        $path = stream_get_meta_data($file)['uri'];
        try {
            $chunk_size = 4096; // Haven't bothered to tune this, maybe other values would work better??
            $got = 0; $data = null;

            // Grab the first 64 KB of the file
            while(!feof($urlp) && $got < $dataLimit) {
                $data = $data . fgets($urlp, $chunk_size);
                $got = strlen($data);
            }
            fwrite($file, $data);  // Grab the last 64 KB of the file, if we know how big it is.  if ($size > 0) {

            // Now $fp should be the first and last 64KB of the file!!
            @fclose($urlp);
        } catch (Exception $e) {
            @fclose($file);
            @fclose($urlp);
            throw new Q_Exception('Error reading remote file using fopen');
        }

        include_once(Q_CLASSES_DIR.DS.'Audio'.DS.'getid3'.DS.'getid3.php');
        $getID3 = new getID3();
        $metaData = $getID3->analyze($path);
        getid3_lib::CopyTagsToComments($metaData);

        $title = Q::ifset($metaData, 'comments', 'title', 0, null);
        $artist = Q::ifset($metaData, 'comments', 'artist', 0, null);

        $name = ($artist ? $artist.': ' : '') . $title;

        if ($name) {
            $metaData['comments']['name'] = $name;
        } else {
            // try to get name from headers
            $headers = get_headers($url, 1);
            $contentDisposition = $headers["Content-Disposition"];
            $fileName = self::getFilenameFromDisposition($contentDisposition);
            if ($fileName) {
                $name = pathinfo($fileName, PATHINFO_FILENAME);
            }

            if ($name) {
                $metaData['comments']['name'] = $name;
            } else {
                // try to get name from url string
                $name = pathinfo($url, PATHINFO_FILENAME);
                if ($name) {
                    $metaData['comments']['name'] = $name;
                } else {
                    $metaData['comments']['name'] = null;
                }
            }
        }

        if ($closeFile) {
			@fclose($file);
		} else {
			$metaData['fileHandler'] = $file;
		}

        return $metaData;
    }
    /**
     * Get file name from Content-Disposition header raw
     * @method getFilenameFromDisposition
     * @static
     * @param {string} $contentDisposition
     * @return string
     */
    static function getFilenameFromDisposition ($contentDisposition) {
        // Get the filename.
        $filename = null;

        $value = trim( $contentDisposition );

        if ( strpos( $value, ';' ) === false ) {
            return null;
        }

        list( $type, $attr_parts ) = explode( ';', $value, 2 );

        $attr_parts = explode( ';', $attr_parts );
        $attributes = array();

        foreach ( $attr_parts as $part ) {
            if ( strpos( $part, '=' ) === false ) {
                continue;
            }

            list( $key, $value ) = explode( '=', $part, 2 );

            $attributes[ trim( $key ) ] = trim( $value );
        }

        if ( empty( $attributes['filename'] ) ) {
            return null;
        }

        $filename = trim( $attributes['filename'] );

        // Unquote quoted filename, but after trimming.
        if ( substr( $filename, 0, 1 ) === '"' && substr( $filename, -1, 1 ) === '"' ) {
            $filename = substr( $filename, 1, -1 );
        }

        return $filename;
    }
	/**
	 * Create Websites/webpage stream from params
	 * May return existing stream for this url (fetched without acceess checks)
	 * @method createStream
	 * @static
	 * @param {array} $params
	 * @param {string} [$params.asUserId=null] The user who would be create stream. If null - logged user id.
	 * @param {string} [$params.publisherId=null] Stream publisher id. If null - logged in user.
	 * @param {string} [$params.url]
	 * @param {string} [quotaName='Websites/webpage/chat'] Default quota name. Can be:
	 * 	Websites/webpage/conversation - create Websites/webpage stream for conversation about webpage
	 * 	Websites/webpage/chat - create Websites/webpage stream from chat to cache webpage.
	 * @param {bool} [$skipAccess=false] Whether to skip access in Streams::create and quota checking.
	 * @throws Exception
	 * @return Streams_Stream
	 */
	static function createStream ($params, $quotaName='Websites/webpage/chat', $skipAccess=false) {
		$url = Q::ifset($params, 'url', null);
		
		// add scheme to url if not exist
		if (parse_url($url, PHP_URL_SCHEME) === null) {
			$url = 'http://'.$url;
		}

		if (!Q_Valid::url($url)) {
			throw new Exception("Invalid URL");
		}

		$siteData = self::scrape($url);

		$urlParsed = parse_url($url);
		$loggedUserId = Users::loggedInUser(true)->id;

		$asUserId = Q::ifset($params, "asUserId", $loggedUserId);
		$publisherId = Q::ifset($params, "publisherId", $loggedUserId);

		$streamType = self::getStreamType($url);

		// check if stream for this url has been already created
		// and if yes, return it
		if ($webpageStream = self::fetchStream($url)) {
			return $webpageStream;
		}

		$quota = null;
		if (!$skipAccess) {
			// check quota
			$roles = Users::roles();
			$quota = Users_Quota::check($asUserId, '', $quotaName, true, 1, $roles);
		}

		$streamsStream = new Streams_Stream();
		$title = Q::ifset($siteData, 'title', substr($url, strrpos($url, '/') + 1));
		$title = $title ? mb_substr($title, 0, $streamsStream->maxSize_title(), "UTF-8") : '';

		$keywords = Q::ifset($siteData, 'keywords', null);
		$description = mb_substr(Q::ifset($siteData, 'description', ''), 0, $streamsStream->maxSize_content(), "UTF-8");
		$copyright = Q::ifset($siteData, 'copyright', null);
		$iconBig = self::normalizeHref(Q::ifset($siteData, 'iconBig', null), $url);
		$iconSmall = self::normalizeHref(Q::ifset($siteData, 'iconSmall', null), $url);
		$contentType = Q::ifset($siteData, 'headers', 'Content-Type', 'text/html'); // content type by default text/html
		$contentType = explode(';', $contentType)[0];
		$streamIcon = $iconBig ? $iconBig : Q_Config::get('Streams', 'types', 'Websites/webpage', 'defaults', 'icon', null);

		// special interest stream for websites/webpage stream
		$port = Q::ifset($urlParsed, 'port', null);
		$host = $urlParsed['host'];
		$interestTitle = 'Websites: '.$host.($port ? ':'.$port : '');
		// insofar as user created Websites/webpage stream, need to complete all actions related to interest created from client
		Q::event('Streams/interest/post', array(
			'title' => $interestTitle,
			'userId' => $publisherId
		));
		$interestPublisherId = Q_Response::getSlot('publisherId');
		$interestStreamName = Q_Response::getSlot('streamName');

		$interestStream = Streams_Stream::fetch(null, $interestPublisherId, $interestStreamName);

		if ($contentType != 'text/html') {
			// trying to get icon
			Q_Config::load(WEBSITES_PLUGIN_CONFIG_DIR.DS.'mime-types.json');
			$extension = Q_Config::get('mime-types', $contentType, '_blank');
			$urlPrefix = '{{baseUrl}}/{{Streams}}/img/icons/files';
			$streamIcon = file_exists(STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons'.DS.'files'.DS.$extension)
				? "$urlPrefix/$extension"
				: "$urlPrefix/_blank";
		}

		// set icon for interest stream
		if ($interestStream instanceof Streams_Stream
		&& !Users::isCustomIcon($interestStream->icon)) {
			$result = null;

			if (Q_Valid::url($iconSmall)) {
				try {
					$result = Users::importIcon($interestStream, array(
						'32.png' => $iconSmall
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

		$streamName = $streamType."/".self::normalizeUrl($url);

		$td = trim($description);
		$streamParams = array(
            'name' => $streamName,
            'title' => trim($title),
			'icon' => $streamIcon,
            'content' => $td ? $td : "",
            'attributes' => array(
                'url' => $url,
                'urlParsed' => $urlParsed,
                'image' => $iconBig,
                'host' => $host,
                'port' => $port,
                'copyright' => $copyright,
                'contentType' => $contentType,
				'interest' => array(
					'publisherId' => $interestStream->publisherId,
					'streamName' => $interestStream->name
				),
                'lang' => Q::ifset($siteData, 'lang', 'en')
            ),
            'skipAccess' => $skipAccess
        );
		$relatedParams = array(
            'publisherId' => $interestPublisherId,
            'streamName' => $interestStreamName,
            'type' => $streamType.'/interest'
        );

		if ($streamType == 'Websites/webpage') {
            $webpageStream = Streams::create($asUserId, $publisherId, $streamType, $streamParams, $relatedParams);
		} else {
            $streamParams['publisherId'] = $publisherId;
            $streamParams['streamName'] = $streamName;

            $webpageStream = Q::event($streamType.'/post', array(
                'streamParams' => $streamParams,
                'relatedParams' => $relatedParams
            ));
        }

		// grant access to this stream for logged user
		$streamsAccess = new Streams_Access();
		$streamsAccess->publisherId = $webpageStream->publisherId;
		$streamsAccess->streamName = $webpageStream->name;
		$streamsAccess->ofUserId = $asUserId;
		$streamsAccess->readLevel = Streams::$READ_LEVEL['max'];
		$streamsAccess->writeLevel = Streams::$WRITE_LEVEL['max'];
		$streamsAccess->adminLevel = Streams::$ADMIN_LEVEL['max'];
		$streamsAccess->save();

		// if publisher not community, subscribe publisher to this stream
		if (!Users::isCommunityId($publisherId)) {
			$webpageStream->subscribe(array('userId' => $publisherId));
		}

		// handle with keywords
		if (!empty($keywords)) {
			$delimiter = preg_match("/,/", $keywords) ? ',' : ' ';
			foreach (explode($delimiter, $keywords) as $keyword) {
				$keywordInterestStream = Streams::getInterest(trim($keyword));
				if ($keywordInterestStream instanceof Streams_Stream) {
					$webpageStream->relateTo($keywordInterestStream, $webpageStream->type.'/keyword', $webpageStream->publisherId, array(
						'skipAccess' => true
					));
				}
			}
		}

		// set quota
		if (!$skipAccess && $quota instanceof Users_Quota) {
			$quota->used();
		}

		return $webpageStream;
	}
	/**
	 * Get stream interests in one array with items having properties
	 *  {publisherId, streamName, title}
	 * @method getInterests
	 * @static
	 * @param Streams_Stream $stream Websites/webpage stream
	 * @return array
	 */
	static function getInterests($stream)
	{
		$rows = Streams_Stream::select('ss.publisherId, ss.name as streamName, ss.title', 'ss')
			->join(Streams_relatedTo::table(true, 'srt'), array(
				'srt.toStreamName' => 'ss.name',
				'srt.toPublisherId' => 'ss.publisherId'
			))->where(array(
				//'srt.fromPublisherId' => $stream->publisherId,
				'srt.fromStreamName' => $stream->name,
				'srt.type' => $stream->type.'/interest'
			))
			->orderBy('srt.weight', false)
			->fetchDbRows();

		return $rows[0];
	}
	/**
	 * Get stream interests in one array with items having properties
	 *  {publisherId, streamName, title}
	 * @method getKeywords
	 * @static
	 * @param Streams_Stream $stream Websites/webpage stream
	 * @return array
	 */
	static function getKeywords($stream)
	{
		$rows = Streams_Stream::select('ss.publisherId, ss.name, ss.title', 'ss')
			->join(Streams_relatedTo::table(true, 'srt'), array(
				'srt.toStreamName' => 'ss.name',
				'srt.toPublisherId' => 'ss.publisherId'
			))->where(array(
				'srt.fromPublisherId' => $stream->publisherId,
				'srt.fromStreamName' => $stream->name,
				'srt.type' => $stream->type.'/keyword'
			))
			->orderBy('srt.weight', false)
			->fetchDbRows();

		return $rows;
	}

	/**
	 * Import icon to stream
	 * @method importIcon
	 * @static
	 * @param {String} $url image url
	 * @param Streams_Stream $stream
	 */
	static function importIcon ($url, $stream) {
		if (!Q_Valid::url($url)) {
			return;
		}

		$icon = file_get_contents($url);

		// if icon is valid image
		if ($icon && imagecreatefromstring($icon)) {
			// upload image to stream
			Q_Image::save(array(
				'data' => $icon, // these frills, with base64 and comma, to format image data for Q/image/post handler.
				'path' => "Q/uploads/Streams",
				'subpath' => Q_Utils::splitId($stream->publisherId, 3, '/')."/".$stream->name."/icon/".time(),
				'save' => "Websites/image"
			));
		}
	}
}
