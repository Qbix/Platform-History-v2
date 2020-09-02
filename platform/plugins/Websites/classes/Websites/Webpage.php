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
     * @param boolean [$checkStream=true] If false, skip checking stream for this url. Scrape source anyway.
	 * @throws Q_Exception
	 * @return array
	 */
	static function scrape($url, $checkStream = true)
	{
		// add scheme to url if not exist
		if (parse_url($url, PHP_URL_SCHEME) === null) {
			$url = 'http://'.$url;
		}

		if (!Q_Valid::url($url)) {
			throw new Exception("Invalid URL");
		}

		$parsedUrl = parse_url($url);

		//$document = file_get_contents($url);

        // try to get stream
        if ($checkStream) {
            $streamType = self::getStreamType($url);
            $stream = self::fetchStream($url, $streamType);
            if ($stream) {
                return  array(
                    'title' => $stream->title,
                    'url' => $stream->getAttribute("url"),
                    'bigIcon' => $stream->getAttribute("bigIcon"),
                    'smallIcon' => $stream->getAttribute("smallIcon"),
                    'host' => $stream->getAttribute("host")
                );
            }
        }

        $headers = get_headers($url, 1);
        if (is_array($headers['Content-Type'])) {
            $contentType = end($headers['Content-Type']);
        } else {
            $contentType = $headers['Content-Type'];
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
                ? "$urlPrefix/$extension"
                : "$urlPrefix/_blank";


            $result = array(
                'title' => Q::ifset($fileInfo, 'comments', 'name', null),
                'url' => $url,
                'bigIcon' => $icon,
                'smallIcon' => $icon,
                'host' => $parsedUrl['host']
            );

            return $result;
        }

		// get source with header
		// "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36"
		$response = Q_Utils::get($url, $_SERVER['HTTP_USER_AGENT'], array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_VERBOSE => true,
			CURLOPT_HEADER => true,
			CURLOPT_FOLLOWLOCATION => true
		));
		$response = explode("\r\n\r\n", $response);
		if (!is_array($response) || count($response) < 2) {
			throw new Exception("Server return wrong response!");
		}
		$http_response_header = $document = '';
		foreach ($response as $i => $item) {
			if (strpos($item, 'HTTP/') === 0 && empty($document)) {
				$http_response_header = explode("\n", $item);
			} else {
				$document .= $item;
			}
		}

		//If http response header mentions that content is gzipped, then uncompress it
		foreach ($http_response_header as $item) {
			if(stristr($item, 'content-encoding') && stristr($item, 'gzip') && 0 === mb_strpos($document, "\x1f" . "\x8b" . "\x08", 0, "US-ASCII")) {
				//Now lets uncompress the compressed data
				$document = gzinflate(substr($document,10,-8) );
				break;
			}
		}

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
		if (is_string($http_response_header)) {
			$http_response_header = explode("\n", $http_response_header);
		}

		foreach ($http_response_header as $item) {
			$middle = explode(":",$item);
			$result['headers'][trim($middle[0])] = trim(Q::ifset($middle, 1, null));
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
		$result['url'] = $canonicalUrl ? $canonicalUrl : $url;

		// get big icon
		$icon = Q::ifset($result, 'image', null);
		$bigIconAllowedMetas = array( // search icon among <link> with these "rel"
			'apple-touch-icon',
			'apple-touch-icon-precomposed',
			'icon'
		);
		if (Q_Valid::url($icon)) {
			$result['bigIcon'] = $icon;
		} else {
			foreach ($bigIconAllowedMetas as $item) {
				if ($item = Q::ifset($icons, $item, null)) {
					$result['bigIcon'] = $item;
					break;
				}
			}
		}

		// get small icon
		$smallIconAllowedMetas = array( // search icon among <link> with these "rel"
			'icon',
			'shortcut icon'
		);
		foreach ($smallIconAllowedMetas as $item) {
			if ($item = Q::ifset($icons, $item, null)) {
				$result['smallIcon'] = $item;
				break;
			}

			// by default
			$result['smallIcon'] = $result['bigIcon'];
		}

		// as we don't support SVG images in Users::importIcon, try to select another image
		// when we start support SVG, just remove these blocks
		if (pathinfo($result['bigIcon'], PATHINFO_EXTENSION) == 'svg') {
			reset($bigIconAllowedMetas);
			foreach ($bigIconAllowedMetas as $item) {
				$item = Q::ifset($icons, $item, null);
				if ($item && pathinfo($item, PATHINFO_EXTENSION) != 'svg') {
					$result['bigIcon'] = $item;
					break;
				}
			}
		}
		if (pathinfo($result['smallIcon'], PATHINFO_EXTENSION) == 'svg') {
			reset($smallIconAllowedMetas);
			foreach ($smallIconAllowedMetas as $item) {
				$item = Q::ifset($icons, $item, null);
				if ($item && pathinfo($item, PATHINFO_EXTENSION) != 'svg') {
					$result['smallIcon'] = $item;
					break;
				}
			}
		}
		//---------------------------------------------------------------

		// if big icon empty, set it to small icon
		if (empty($result['bigIcon']) && !empty($result['smallIcon'])) {
			$result['bigIcon'] = $result['smallIcon'];
		}

		// additional handler for youtube.com
		if (in_array($parsedUrl['host'], array('www.youtube.com', 'youtube.com'))) {
			$googleapisKey = Q_Config::expect('Websites', 'youtube', 'keys', 'server');
			preg_match("#(?<=v=)[a-zA-Z0-9-]+(?=&)|(?<=v\\/)[^&\n]+(?=\\?)|(?<=v=)[^&\n]+|(?<=youtu.be/)[^&\n]+#", $url, $googleapisMatches);
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

		$result['bigIcon'] = Q::ifset($result, 'bigIcon', Q_Uri::interpolateUrl("{{baseUrl}}/{{Websites}}/img/icons/Websites/webpage/80.png"));
		$result['smallIcon'] = Q::ifset($result, 'smallIcon', Q_Uri::interpolateUrl("{{baseUrl}}/{{Websites}}/img/icons/Websites/webpage/40.png"));
		$result['host'] = $parsedUrl['host'];

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

		if (preg_match("#^\\/\\/#", $href)) {
			return $parts['scheme'].':'.$href;
		}

		if (preg_match("#^\\/#", $href)) {
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
	 * @param {string} $url URL string to search stream by.
     * @param {string} $streamType Type of stream to search
	 * @return Streams_Stream
	 */
	static function fetchStream($url, $streamType = "Websites/webpage") {
		$streams = new Streams_Stream();
		$streams->name = $streamType.'/'.self::normalizeUrl($url);
		if ($streams->retrieve()) {
			return Streams::fetchOne($streams->publisherId, $streams->publisherId, $streams->name);
		}

		$streams->name .= '_';
		if ($streams->retrieve()) {
			return Streams::fetchOne($streams->publisherId, $streams->publisherId, $streams->name);
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
        $extension = Q::ifset($path_info, 'extension', null);

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
     * Get meta data from remote file by url
     * @method getRemoteFileInfo
     * @static
     * @param {string} $url
     * @param {integer} [$dataLimit=65536] Limit data length (bites) to download. Default 64Kb.
     * @throws Q_Exception
     * @return array
     */
    static function getRemoteFileInfo ($url, $dataLimit = 65536) {
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

        @fclose($file);
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
	 * @param {string} [$params.title]
	 * @param {string} [$params.keywords]
	 * @param {string} [$params.description]
	 * @param {string} [$params.bigIcon]
	 * @param {string} [$params.smallIcon]
	 * @param {array} [$params.headers] array with key "Content-Type"
	 * @param {string} [$params.lang] two-letter code
	 * @param {string} [quotaName='Websites/webpage/chat'] Default quota name. Can be:
	 * 	Websites/webpage/conversation - create Websites/webpage stream for conversation about webpage
	 * 	Websites/webpage/chat - create Websites/webpage stream from chat to cache webpage.
	 * @param {bool} [$skipAccess=false] Whether to skip access in Streams::create and quota checking.
	 * @throws Exception
	 * @return Streams_Stream
	 */
	static function createStream ($params, $quotaName='Websites/webpage/chat', $skipAccess=false) {
		$url = Q::ifset($params, 'url', null);
		if (!Q_Valid::url($url)) {
			throw new Exception("Invalid URL");
		}
		$urlParsed = parse_url($url);
		$loggedUserId = Users::loggedInUser(true)->id;

		$asUserId = Q::ifset($params, "asUserId", $loggedUserId);
		$publisherId = Q::ifset($params, "publisherId", $loggedUserId);

		$streamType = self::getStreamType($url);

		// check if stream for this url has been already created
		// and if yes, return it
		if ($webpageStream = self::fetchStream($url, $streamType)) {
			return $webpageStream;
		}
		
		$quota = null;
		if (!$skipAccess) {
			// check quota
			$roles = Users::roles();
			$quota = Users_Quota::check($asUserId, '', $quotaName, true, 1, $roles);
		}

		$title = Q::ifset($params, 'title', substr($url, strrpos($url, '/') + 1));
		$title = $title ? substr($title, 0, 255) : '';

		$keywords = Q::ifset($params, 'keywords', null);
		$description = substr(Q::ifset($params, 'description', ''), 0, 1023);
		$copyright = Q::ifset($params, 'copyright', null);
		$bigIcon = self::normalizeHref(Q::ifset($params, 'bigIcon', null), $url);
		$smallIcon = self::normalizeHref(Q::ifset($params, 'smallIcon', null), $url);
		$contentType = Q::ifset($params, 'headers', 'Content-Type', 'text/html'); // content type by default text/html
		$contentType = explode(';', $contentType)[0];
		$streamIcon = Q_Config::get('Streams', 'types', 'Websites/webpage', 'defaults', 'icon', null);

		// special interest stream for websites/webpage stream
		$port = Q::ifset($urlParsed, 'port', null);
		$interestTitle = 'Websites: '.$urlParsed['host'].($port ? ':'.$port : '');
		// insofar as user created Websites/webpage stream, need to complete all actions related to interest created from client
		Q::event('Streams/interest/post', array(
			'title' => $interestTitle,
			'userId' => $publisherId
		));
		$interestPublisherId = Q_Response::getSlot('publisherId');
		$interestStreamName = Q_Response::getSlot('streamName');

		$interestStream = Streams::fetchOne(null, $interestPublisherId, $interestStreamName);

		if ($contentType != 'text/html') {
			// trying to get icon
			Q_Config::load(WEBSITES_PLUGIN_CONFIG_DIR.DS.'mime-types.json');
			$extension = Q_Config::get('mime-types', $contentType, '_blank');
			$urlPrefix = Q_Request::baseUrl().'/{{Streams}}/img/icons/files';
			$streamIcon = file_exists(STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons'.DS.'files'.DS.$extension)
				? "$urlPrefix/$extension"
				: "$urlPrefix/_blank";
		}

		// set icon for interest stream
		if ($interestStream instanceof Streams_Stream
		&& !Users::isCustomIcon($interestStream->icon)) {
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

		$streamName = $streamType."/".self::normalizeUrl($url);

		$td = trim($description);
		$streamParams = array(
            'name' => $streamName,
            'title' => trim($title),
            'content' => $td ? $td : "",
            'icon' => $streamIcon,
            'attributes' => array(
                'url' => $url,
                'urlParsed' => $urlParsed,
                'icon' => $bigIcon,
                'copyright' => $copyright,
                'contentType' => $contentType,
                'lang' => Q::ifset($params, 'lang', 'en')
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
            $streamParams['icon'] = $bigIcon ?: $streamIcon;

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
	 * Get stream interests in one array
	 * return should be
	[
	{publisherId: "...", streamName: "...", title: "..."},
	{publisherId: "...", streamName: "...", title: "..."},
	...
	]
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
				'srt.fromPublisherId' => $stream->publisherId,
				'srt.fromStreamName' => $stream->name,
				'srt.type' => $stream->type.'/interest'
			))
			->orderBy('srt.weight', false)
			->fetchDbRows();

		return $rows[0];
	}
	/**
	 * Get stream keywords in one array
	 * return should be
	[
	{publisherId: "...", streamName: "...", title: "..."},
	{publisherId: "...", streamName: "...", title: "..."},
	...
	]
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
}
