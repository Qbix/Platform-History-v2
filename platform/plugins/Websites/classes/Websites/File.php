<?php
/**
 * @module Websites
 */
/**
 * Class for dealing with files
 * 
 * @class Websites_File
 */
class Websites_File extends Base_Websites_Webpage
{
	/**
	 * Get URL, load file and scrape info to cache
	 * @method scrape
	 * @static
	 * @param {string} $url Page source to load
	 * @param {boolean} [$skipAccess=fasle] If true, skip all permissions and quotas checking
	 * @throws Q_Exception
	 * @return array
	 */
	static function scrape($url, $skipAccess=false)
	{
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

        // try to get cache
		$webpageCahe = null;
		if (Q_Config::get('Websites', 'cache', 'webpage', true)) {
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
					$cacheDuration = Q_Config::get('Websites', 'cache', 'duration', 60*60*24*30); // default 1 month
					if ($currentTime - $updatedTime < $cacheDuration) {
						// there are cached webpage results that are still viable
						return json_decode($webpageCahe->results, true);
					}
				}
			}
		}

		$asUserId = Users::loggedInUser(true)->id;
		$quota = null;
		if (!$skipAccess) {
			// check quota
			$roles = Users::roles();
			$quota = Users_Quota::check($asUserId, '', "Websites/cache", true, 1, $roles);
		}

		$headers = get_headers($url, 1);
		$headers = array_change_key_case($headers, CASE_LOWER);

		$cacheFileLimit = (int)Q_Config::get("Websites", "cacheFileLimit", 5242880);
		$text = Q_Text::get("Websites/content");
		$errorFileSize = Q::interpolate($text["webpage"]["FileTooLarge"], array('size' => self::formatBytes($cacheFileLimit)));

		if ((int)$headers['content-length'] > $cacheFileLimit) {
			throw new Exception($errorFileSize);
		}

		//$fileInfo = Websites_Webpage::getRemoteFileInfo($url, $cacheFileLimit, false);
		$tmpFile = tmpfile();
		$tmpPath = stream_get_meta_data($tmpFile)['uri'];
		fwrite($tmpFile, Websites_Webpage::readURL($url, $cacheFileLimit * 1.2));
		if (filesize($tmpPath) > $cacheFileLimit) {
			@fclose($tmpFile);
			throw new Exception($errorFileSize);
		}

		// check mime type
		$finfo = finfo_open(FILEINFO_MIME_TYPE);
		//$mimeType = Q::ifset($fileInfo, 'fileformat', Q::ifset($fileInfo, 'mime_type', strtolower(pathinfo($url, PATHINFO_EXTENSION))));
		$mimeType = finfo_file($finfo, $tmpPath);
		$extension = Q_Config::get('mime-types', $mimeType, '_blank');
		$streamIcon = file_exists(STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons'.DS.'files'.DS.$extension)
			? "files/$extension"
			: "files/_blank";

		$destinationPath = self::getCachePath($url);
		$destinationUrl = self::getCachePath($url, "url");
		self::cacheFile($tmpPath, $destinationPath);

		$result = array_merge($result, array(
			'title' => basename($url),
			'url' => $url,
			'type' => $extension,
			'destinationUrl' => $destinationUrl,
			'icon' => $streamIcon,
			'streamType' => "Streams/".$extension
		));

		if ($webpageCahe) {
			$webpageCahe->url = $url;

			$webpageCahe->cache = str_replace(self::getCachePath(), "", $destinationPath);

			// dummy interest block for cache
			$result['interest'] = array(
				'title' => $url,
				'icon' => $streamIcon
			);
			$webpageCahe->results = json_encode($result);
			$webpageCahe->save();
		}

		// set quota
		if (!$skipAccess && $quota instanceof Users_Quota) {
			$quota->used();
		}

		return $result;
	}
	/**
	 * Clear cache dir to limited size and copy file to cache dir
	 * @method cacheFile
	 * @static
	 * @param {string} $copyFrom Path to file to copy from
	 * @param {string} $copyTo Destination path
	 */
	static function cacheFile ($copyFrom, $copyTo) {
		// clear cache directory volume to cacheDirectoryLimit
		self::clearCache(Q_Config::get("Websites", "cacheDirectoryLimit", 0));

		if(!file_exists(dirname($copyTo))) {
			mkdir(dirname($copyTo),0775,true);
		}

		// copy new file
		copy($copyFrom, $copyTo);
	}
	/**
	 * Clear cache dir to limited size (or completely if $dirMaxSize = 0)
	 * @method clearCache
	 * @static
	 * @param {integer} [$dirMaxSize=0] Clear dir to this size. If $dirMaxSize = 0 clear completely.
	 */
	static function clearCache ($dirMaxSize = 0) {
		// check max directory volume and remove old files till limit
		$dir = self::getCachePath();
		if(!file_exists($dir)){
			throw new Exception("Error: websites cache dir not exists");
		}

		$files = array();
		$dirSize = 0;
		foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)) as $object){
			try {
				$fileSize = $object->getSize();
				$fileName = $object->getFilename();
				$filePath = $object->getPathname();
				$fileModTime = $object->getMTime();
				$dirSize += $fileSize;

				$files[$fileModTime] = array(
					"path" => $filePath,
					"name" => $fileName,
					"size" => $fileSize
				);
			} catch (Exception $e) {}
		}

		if ($dirSize <= $dirMaxSize) {
			return;
		}

		// sort
		ksort($files);

		// remove oldest files till $dirMaxSize
		foreach ($files as $fileModTime => $file) {
			if (!unlink($file["path"])) {
				continue;
			}

			// remove from websites_webpage table
			$websitesWebpage = new Websites_Webpage();
			$websitesWebpage->cache = str_replace($dir, "", $file["path"]);
			if ($websitesWebpage->retrieve()) {
				$websitesWebpage->remove();
			}

			$dirSize -= $file["size"];
			unset($files[$fileModTime]);
			if ($dirSize <= $dirMaxSize) {
				break;
			}
		}
	}
	/**
	 * Get file path by url to cache url source
	 * @method getCachePath
	 * @static
	 * @param {string} [$url=null] If url defined, return path to file generated from this url. If null return directory path.
	 * @param {string} [$which="path"] If "path" return local OS path, if "url" return url
	 * @return String
	 */
	static function getCachePath ($url=null, $which="path") {
		switch ($which) {
			case "path":
				$basedir = APP_FILES_DIR.DS.Q::app().DS.'uploads'.DS.'Websites'.DS;
				// if dir not exists - create one
				if(!file_exists($basedir)) {
					mkdir($basedir,0775,true);
				}
				break;
			case "url":
				$basedir = Q_Request::baseUrl().'/Q/uploads/Websites/';
				break;
			default:
				throw new Exception("Invalid 'which' param");
		}

		if ($url) {
			$host = parse_url($url, PHP_URL_HOST);
			$hostNormalized = Websites_Webpage::normalizeUrl($host);
			$subPath = preg_replace("/.*$host\//", '', $url);
			$subPath = Websites_Webpage::normalizeUrl($subPath);
			if ($which == "path") {
				$basedir .= $hostNormalized.DS;
			} else {
				$basedir .= $hostNormalized.'/';
			}
			$basedir .= $subPath;
		}

		return $basedir;
	}
	/**
	 * Format bytes integer to human readable size string
	 * @method formatBytes
	 * @static
	 * @param {int} $bytes
	 * @param {int} [$precision=2] Amount digits after dot
	 * @return String
	 */
	static function formatBytes ($bytes, $precision = 2) {
		$units = array('B', 'KB', 'MB', 'GB', 'TB');

		$bytes = max($bytes, 0);
		$pow = floor(($bytes ? log($bytes) : 0) / log(1024));
		$pow = min($pow, count($units) - 1);

		// Uncomment one of the following alternatives
		$bytes /= pow(1024, $pow);
		// $bytes /= (1 << (10 * $pow));

		return round($bytes, $precision) . $units[$pow];
	}
	/**
	 * Create stream from params
	 * May return existing stream for this url (fetched without permissions checks)
	 * @method createStream
	 * @static
	 * @param {array} $params
	 * @param {string} [$params.asUserId=null] The user who would be create stream. If null - logged user id.
	 * @param {string} [$params.publisherId=null] Stream publisher id. If null - logged in user.
	 * @param {string} [$params.url]
	 * @param {string} [quotaName='Websites/webpage/chat'] Default quota name. Can be:
	 * 	Websites/webpage/conversation - create Websites/webpage stream for conversation about webpage
	 * 	Websites/webpage/chat - create Websites/webpage stream from chat to cache webpage.
	 * @param {array} $relatedParams Array with category params to relate site to: array("publisherId" => ..., "streamName" => ..., "type" => ...)
	 * @param {bool} [$skipAccess=false] Whether to skip access in Streams::create and quota checking.
	 * @return Streams_Stream
	 *@throws Exception
	 */
	static function createStream ($params, $quotaName='Websites/webpage/chat', $relatedParams=array(), $skipAccess=false) {
		$url = Q::ifset($params, 'url', null);
		$clipStart = Q::ifset($params, 'clipStart', null);
		$clipEnd = Q::ifset($params, 'clipEnd', null);

		// add scheme to url if not exist
		if (parse_url($url, PHP_URL_SCHEME) === null) {
			$url = 'http://'.$url;
		}

		if (!Q_Valid::url($url)) {
			throw new Exception("Invalid URL");
		}

		$fileData = self::scrape($url);

		$urlParsed = parse_url($url);
		$loggedUserId = Users::loggedInUser(true)->id;

		$asUserId = Q::ifset($params, "asUserId", $loggedUserId);
		$publisherId = Q::ifset($params, "publisherId", $loggedUserId);

		$quota = null;
		if (!$skipAccess) {
			// check quota
			$roles = Users::roles();
			$quota = Users_Quota::check($asUserId, '', $quotaName, true, 1, $roles);
		}

		$streamsStream = new Streams_Stream();
		$title = Q::ifset($fileData, 'title', substr($url, strrpos($url, '/') + 1));
		$title = $title ? mb_substr($title, 0, $streamsStream->maxSize_title(), "UTF-8") : '';
		$description = mb_substr(Q::ifset($fileData, 'description', ''), 0, $streamsStream->maxSize_content(), "UTF-8");

		$streamParams = array(
            'title' => trim($title),
            'content' => trim($description),
            'icon' => $fileData['icon'],
            'attributes' => array(
                'url' => $url,
                'urlParsed' => $urlParsed,
				'clipStart' => $clipStart,
				'clipEnd' => $clipEnd,
				'lang' => Q::ifset($fileData, 'lang', 'en')
			),
            'skipAccess' => $skipAccess
        );

		$stream = Streams::create($asUserId, $publisherId, $fileData['streamType'], $streamParams, $relatedParams);

		// copy file to stream uploads dest
		self::saveStreamFile($stream, self::getCachePath($url));
		//$stream->setAttribute('Q.file.url', self::saveStreamFile($stream, self::getCachePath($url)));
		//$stream->save();

		if ($asUserId != $stream->publisherId) {
			// grant access to this stream for logged user
			$streamsAccess = new Streams_Access();
			$streamsAccess->publisherId = $stream->publisherId;
			$streamsAccess->streamName = $stream->name;
			$streamsAccess->ofUserId = $asUserId;
			$streamsAccess->readLevel = Streams::$READ_LEVEL['max'];
			$streamsAccess->writeLevel = Streams::$WRITE_LEVEL['max'];
			$streamsAccess->adminLevel = Streams::$ADMIN_LEVEL['max'];
			if (!$streamsAccess->retrieve()) {
				$streamsAccess->save();
			}
		}

		// if publisher not community, subscribe publisher to this stream
		if (!Users::isCommunityId($publisherId)) {
			$stream->subscribe(array('userId' => $publisherId));
		}

		// set quota
		if (!$skipAccess && $quota instanceof Users_Quota) {
			$quota->used();
		}

		return $stream;
	}
	/**
	 * Edit stream with new url
	 * @method editStream
	 * @static
	 * @param {array} $params
	 * @param {string} [$params.asUserId=null] The user who would be modify stream. If null - logged user id.
	 * @param {string} [$params.stream]
	 * @param {string} [$params.url]
	 * @param {string} [$params.clipStart]
	 * @param {string} [$params.clipEnd]
	 * @return Streams_Stream
	 *@throws Exception
	 */
	static function editStream ($params) {
		$stream = Q::ifset($params, 'stream', null);
		$url = Q::ifset($params, 'url', null);
		$clipStart = Q::ifset($params, 'clipStart', null);
		$clipEnd = Q::ifset($params, 'clipEnd', null);

		// add scheme to url if not exist
		if (parse_url($url, PHP_URL_SCHEME) === null) {
			$url = 'http://'.$url;
		}

		if (!Q_Valid::url($url)) {
			throw new Exception("Invalid URL");
		}

		if (!($stream instanceof Streams_Stream)) {
			$publisherId = Q::ifset($stream, "publisherId", null);
			$streamName = Q::ifset($stream, "streamName", null);
			if (!$publisherId || !$streamName) {
				throw new Exception("Invalid stream");
			}
			$stream = Streams::fetchOne(null, $publisherId, $streamName);
			if (!($stream instanceof Streams_Stream)) {
				throw new Exception("Invalid stream");
			}
		}

		$fileData = self::scrape($url);

		$title = Q::ifset($fileData, 'title', substr($url, strrpos($url, '/') + 1));
		$title = $title ? mb_substr($title, 0, $stream->maxSize_title(), "UTF-8") : '';
		$description = mb_substr(Q::ifset($fileData, 'description', ''), 0, $stream->maxSize_content(), "UTF-8");

		// copy file to stream uploads dest
		$newFileDest = self::saveStreamFile($stream, self::getCachePath($url));

		$streamParams = array(
			'title' => trim($title),
			'content' => trim($description),
			'attributes' => array(
				'url' => $url,
				'urlParsed' => parse_url($url),
				'clipStart' => $clipStart,
				'clipEnd' => $clipEnd,
				'lang' => Q::ifset($fileData, 'lang', 'en')
			)
		);

		foreach ($streamParams as $field => $streamParam) {
			$stream[$field] = $streamParam;
		}
		$stream->save();

		return $stream;
	}
	/**
	 * Correctly save file for stream to app uploads dir
	 * @method saveStreamFile
	 * @static
	 * @param {Streams_Stream} $stream
	 * @param {string} $path Path to file need to copy from
	 * @return {string} $newFileDest New file path
	 */
	static function saveStreamFile ($stream, $path) {
		if (!is_file($path)) {
			throw new Exception("Source file not found");
		}

		$publisherId = Q::ifset($stream, 'publisherId', null);
		$streamName = Q::ifset($stream, 'name', Q::ifset($stream, 'streamName', null));

		$streamDir = APP_FILES_DIR.DS.Q::app().DS.'uploads'.DS.'Streams'.DS.Q_Utils::splitId($publisherId).DS.$streamName.DS.'file'.DS.time();
		mkdir($streamDir,0775,true);
		$newFileDest = $streamDir.DS.basename($path);
		copy($path, $newFileDest);

		return $newFileDest;
	}
}
