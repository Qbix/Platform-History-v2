<?php

/**
 * @module Q
 */

define("Q_AVATAR_SIZE",		 80);
define("Q_WAVATAR_BACKGROUNDS", 4);
define("Q_WAVATAR_FACES",	   11);
define("Q_WAVATAR_BROWS",	   8);
define("Q_WAVATAR_EYES",		13);
define("Q_WAVATAR_PUPILS",	  11);
define("Q_WAVATAR_MOUTHS",	  19);
define("Q_MAVATAR_LEGS",		5);
define("Q_MAVATAR_HAIR",		5);
define("Q_MAVATAR_ARMS",		5);
define("Q_MAVATAR_BODY",		15);
define("Q_MAVATAR_EYES",		15);
define("Q_MAVATAR_MOUNTH",	  10);
define('Q_SPRITE_Z',			128);

/**
 * Q Image class
 * @class Q_Image
 */
class Q_Image
{
	/**
	 * Gets an array of "WxH" => "$filename.png" pairs from the
	 * "Q"/"images"/$type/"sizes" config. These are stored in the config
	 * for various types of images, so that e.g. clients can't simply
	 * specify their own sizes.
	 * Call array_keys() on the returned value to get just an array of sizes.
	 * @method getSizes
	 * @static
	 * @param {string} $type The type of image
	 * @param {number} [$maxStretch=null] Can pass reference to a variable that will be filled
	 *   with a number from the config, or 1 if nothing is found
	 * @return {array} 
	 * @throws {Q_Exception_MissingConfig} if the config field is missing.
	 */
	static function getSizes($type, &$maxStretch = null)
	{
		$sizes = Q_Config::expect("Q", "images", $type, 'sizes');
		$maxStretch = Q_Config::get("Q", "images", $type, 'maxStretch', 1);
		if (Q::isAssociative($sizes)) {
			return $sizes;
		}

		$sizes2 = array();
		foreach ($sizes as $size) {
			$sizes2[$size] = "$size.png";
		}

		return $sizes2;
	}

	/**
	 * Gets an array of "$filename.png" => $url pairs using the
	 * "Q"/"images"/$type/"sizes" config. These are stored in the config
	 * for various types of images, so that e.g. clients can't simply
	 * specify their own sizes.
	 * Call array_keys() on the returned value to get just an array of sizes.
	 * @method iconArrayWithUrl
	 * @static
	 * @param {string} $url The url of the image to fill the array with.
	 * @param {string} $type The type of image
	 * @param {number} [$maxStretch=null] Can pass reference to a variable that will be filled
	 *   with a number from the config, or 1 if nothing is found
	 * @return {array}
	 * @throws {Q_Exception_MissingConfig} if the config field is missing.
	 */
	static function iconArrayWithUrl($url, $type, &$maxStretch = null)
	{
		$sizes = Q_Image::getSizes($type, $maxStretch);
		$icon = array();
		foreach ($sizes as $size) {
			$icon[$size] = $url;
		}
		return $icon;
	}

	/**
	 * Gets the value of the the "Q"/"images"/$type/"defaultSize" config.
	 * It should be a key in the "Q"/"images"/$type/"sizes" config array.
	 * @method getDefaultSize
	 * @static
	 * @param {string} $type The type of image
	 * @return {array} 
	 * @throws {Q_Exception_MissingConfig} if the config field is missing.
	 */
	static function getDefaultSize($type)
	{
		return Q_Config::expect('Q', 'images', $type, 'defaultSize');
	}
	
	/**
	 * Returns the name of the image size that should be used
	 * based on the device pixel ratio in Q_dpr cookie, if any.
	 * @method calculateSize
	 * @static
	 * @param {double} $size
	 * @param {array} [$sizes=array()] The array of possible sizes for this image
	 * @return {string} The index in the "sizes" array, like "200" or "200x"
	 */
	static function calculateSize($size, $sizes = array())
	{
		$dpr = Q::ifset($_COOKIE, 'Q_dpr', 1);
		$scaled = $size * $dpr;
		$closest = $max = 100000000;
		$index = null;
		foreach ($sizes as $k => $s) {
			$parts = explode('x', $k);
			if (empty($parts[1])) {
				$parts[1] = $parts[0];
			}
			if (!$parts[0]) {
				$parts[0] = $parts[1];
			}
			$diff = $scaled - min($parts[0], $parts[1]);
			if ($diff >= 0 and $diff < $closest) {
				$closest = $diff;
				$index = $k;
			}
		}
		return isset($index) ? $index : "$k"; // take the last key by default
	}

	/**
	 * Returns png avatar image. Can check gravatar.com for avatar
	 * @method avatar
	 * @static
	 * @param {string} $hash The md5 hash to build avatar
	 * @param {integer} [$size=Q_AVATAR_SIZE] Avatar size in pixels
	 * @param [$type='wavatar'] Type of avatar - one of 'wavatar', 'monster', 'imageid'
	 * @param {boolean} [$gravatar=false]
	 * @return {GDImageLink}
     * @throws {Q_Exception} If GD is not supported
     * @throws {Q_Exception_WrongValue} If avatar type is not supported
	 */
	static function avatar($hash, $size = Q_AVATAR_SIZE, $type = 'wavatar', $gravatar = false) {
		if (is_string($size)) {
			$parts = explode('x', $size);
			$size = max((integer)reset($parts), (integer)next($parts));
			if ($size === 0) {
				$size = Q_AVATAR_SIZE;
			}
		}
		if ($gravatar) {
			$avatar = @file_get_contents("http://www.gravatar.com/avatar/$hash?r=g&d=$type&s=$size");
		}
		if (isset($avatar) && $avatar !== false) {
			return $avatar;
		}
        if (empty($size)) $size = Q_AVATAR_SIZE;
        if (empty($type)) $type = 'wavatar';
        if (!function_exists('imagecreatetruecolor')) {
            throw new Q_Exception("PHP GD support not installed!");
        }
        switch ($type) {
            case 'wavatar':
                return self::buildWAvatar($hash, $size);
                break;
            case 'monster':
                return self::buildMAvatar($hash, $size);
                break;
            case 'imageid':
                return self::buildIAvatar($hash, $size);
                break;
            default:
                throw new Q_Exception_WrongValue(array(
                    'field' => 'type', 
                    'range' => "one of: 'wavatar', 'monster', 'imageid'")
                );
				break;
        }
	}
	
	/**
	 * Get an image from pixabay search
	 * @param {string} $keywords Specify some string to search images on pixabay
	 * @param {array} [$options=array()] Any additional options for pixabay api as per its documentation
	 * @param {boolean} [$returnFirstImage=false] If true, downloads and returns the first image as data
	 * @return {string} JSON according to pixabay api documentation
	 */
	static function pixabay($keywords, $options = array(), $returnFirstImage = false)
	{
		$key = Q_Config::expect('Q', 'images', 'pixabay', 'key');
		$defaults = array();
		$options = array_merge($defaults, $options);
		$optionString = http_build_query($options, '', '&');
		$keywords = urlencode(mb_strtolower($keywords, 'UTF-8'));
		$url = "https://pixabay.com/api/?key=$key&q=$keywords&$optionString";
		$json = @file_get_contents($url);
		$data = Q::json_decode($json, true);
		if (!$returnFirstImage) {
			return $data;
		}
		if (empty($data['hits'][0]['webformatURL'])) {
			return null;
		}
		$webformatUrl = $data['hits'][0]['webformatURL'];
		return @file_get_contents($webformatUrl);
	}
	
	/**
	 * Get an image from facebook search
	 * @param {string} $keywords Specify some string to search people on facebook
	 * @param {array} [$options=array()] Any additional options for pixabay api as per its documentation
	 * @param {boolean} [$returnFirstImage=false] If true, downloads and returns the first image as data
	 * @return {array} An array of image URLs representing large photos
	 */
	static function facebook($keywords, $options = array(), $returnFirstImage = false)
	{
		$cookie = Q_Config::expect('Q', 'images', 'facebook', 'cookie');
		$url = 'https://mbasic.facebook.com/search/top/?q='.urlencode($keywords);
		$html = Q_Utils::get($url, null, true, array("cookie: $cookie"));
		$pattern = '/\\<img src=\\"([^\\"]*?)\\" class=\\".*\\" alt=\\"'.$keywords.'\\"/i';
		$matches = array();
		preg_match_all($pattern, $html, $matches);
		$results = array();
		if (!empty($matches[1])) {
			foreach ($matches[1] as $src) {
				$results[] = htmlspecialchars_decode($src);
			}
		}
		if (!$returnFirstImage) {
			return $results;
		}
		return empty($results) ? null : @file_get_contents(reset($results));
	}
	
	/**
	 * Get an image from google image search
	 * @param {string} $keywords Specify some string to search people on facebook
	 * @param {array} [$options=array()] Any additional options for pixabay api as per its documentation
	 * @param {boolean} [$returnFirstImage=false] If true, downloads and returns the first image as data
	 * @return {array} An array of image URLs representing large photos
	 */
	static function google($keywords, $options = array(), $returnFirstImage = false)
	{
		$key = Q_Config::expect('Q', 'images', 'google', 'key');
		$url = 'https://www.googleapis.com/customsearch/v1?'
		. http_build_query(array(
			'imgType' => Q::ifset($options, 'imgType', 'face'),
			'searchType' => Q::ifset($options, 'searchType', 'image'),
			'imgSize' => Q::ifset($options, 'imgSize', 'medium'),
			'num' => 3,
			'cx' => '009593684493750256938:4qicgdisydu',
			'key' => $key,
			'q' => $keywords
		));
		$json = Q_Utils::get($url);
		$result = Q::json_decode($json, true);
		$results = array();
		if (!empty($result['items'])) {
			foreach ($result['items'] as $item) {
				$results[] = $item['link'];
			}
		}
		if (!$returnFirstImage) {
			return $results;
		}
		return empty($results) ? null : @file_get_contents(reset($results));
	}
	
	/**
	 * Saves an image, usually sent by the client, in one or more sizes.
	 * @method save
	 * @static
	 * @param {array} $params 
	 * @param {string} [$params.data] the image data
	 * @param {string} [$params.path="uploads"] parent path under web dir (see subpath)
	 * @param {string} [$params.subpath=""] subpath that should follow the path, to save the image under
	 * @param {string} [$params.merge=""] path under web dir for an optional image to use as a background
	 * @param {string} [$params.crop] array with keys "x", "y", "w", "h" to crop the original image
	 * @param {string} [$params.save='x'] name of config under Q/image/sizes, which
	 *  are an array of $size => $basename pairs
	 *  where the size is of the format "WxH", and either W or H can be empty.
	 *  These are stored in the config for various types of images, 
	 *  and you pass the name of the config, so that e.g. clients can't simply
	 *  specify their own sizes.
	 * @param {string} [$params.skipAccess=false] if true, skips the check for authorization to write files there
	 * @return {array} an array of ($size => $fullImagePath) pairs
	 */
	static function save($params)
	{
		if (empty($params['data'])) {
			throw new Q_Exception("Image data is missing");
		}
		$imageData = $params['data'];
		$image = imagecreatefromstring($imageData);
		if (!$image) {
			throw new Q_Exception("Image type not supported");
		}
		// image dimensions
		$maxW = Q_Config::get('Q', 'uploads', 'limits', 'image', 'width', 5000);
		$maxH = Q_Config::get('Q', 'uploads', 'limits', 'image', 'height', 5000);
		$iw = imagesx($image);
		$ih = imagesy($image);
		if ($maxW and $iw > $maxW) {
			throw new Q_Exception("Uploaded image width exceeds $maxW");
		}
		if ($maxH and $ih > $maxH) {
			throw new Q_Exception("Uploaded image height exceeds $maxH");
		}
	
		// check whether we can write to this path, and create dirs if needed
		$path = isset($params['path'])
			? Q_Uri::interpolateUrl($params['path'])
			: 'Q/uploads';
		$subpath = isset($params['subpath']) ? $params['subpath'] : '';
		$realPath = Q::realPath(APP_WEB_DIR.DS.$path);
		if ($realPath === false) {
			throw new Q_Exception_MissingFile(array(
				'filename' => APP_WEB_DIR.DS.$path
			));
		}
		$writePath = $realPath.($subpath ? DS.$subpath : '');
		$lastChar = substr($writePath, -1);
		if ($lastChar !== DS and $lastChar !== '/') {
			$writePath .= DS;
		}
		$throwIfNotWritable = empty($params['skipAccess']) ? true : null;
		Q_Utils::canWriteToPath($writePath, $throwIfNotWritable, true);
	
		// check if exif is available
		if (self::isJPEG($imageData)) {
			$exif = exif_read_data("data://image/jpeg;base64," . base64_encode($imageData));
			// rotate original image if necessary (hopefully it's not too large).
			if (!empty($exif['Orientation'])) {
				switch ($exif['Orientation']) {
					case 3:
						$image = imagerotate($image, 180, 0);
						break;
					case 6:
						$image = imagerotate($image, -90, 0);
						break;
					case 8:
						$image = imagerotate($image, 90, 0);
						break;
				}
			}
		}
		$crop = isset($params['crop']) ? $params['crop'] : array();
		$save = !empty($params['save']) ? $params['save'] : 'x';
		if (!is_string($save)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'save',
				'type' => 'string'
			));
		}
		$sizes = Q_Image::getSizes($save);
		// crop parameters - size of source image
		$isw = isset($crop['w']) ? $crop['w'] : $iw;
		$ish = isset($crop['h']) ? $crop['h'] : $ih;
		$isx = isset($crop['x']) ? $crop['x'] : 0;
		$isy = isset($crop['y']) ? $crop['y'] : 0;
		// process requested thumbs
		$data = array();
		$merge = null;
		$m = isset($params['merge']) ? $params['merge'] : null;
		if (isset($m) && mb_strtolower(substr($m, -4), 'UTF-8') === '.png') {
			$mergePath = Q::realPath(APP_WEB_DIR.DS.implode(DS, explode('/', $m)));
			if ($mergePath) {
				$merge = imagecreatefrompng($mergePath);
				$mw = imagesx($merge);
				$mh = imagesy($merge);
			}
		}
		$dwMax = $dhMax = 0;
		ksort($sizes); // to make sure square sizes get listed before others, because names are shorter
		foreach ($sizes as $size => $name) {
			if (empty($name)) {
				// generate a filename
				do {
					$name = Q_Utils::randomString(8).'.png';
				} while (file_exists($writePath.$name));
			}
			if (strrpos($name, '.') === false) {
				$name .= '.png';
			}
			$parts = explode('.', $name);
			$ext = end($parts);
			$sw = $isw;
			$sh = $ish;
			$sx = $isx;
			$sy = $isy;
			// determine destination image size
			if (empty($size) || $size == 'x') {
				$size = 'x';
				$dw = $w2 = $sw;
				$dh = $h2 = $sh;
			} else {
				$sa = explode('x', $size);
				$square = (count($sa) == 1);
				if ($square) {
					$dw = $dh = intval($sa[0]);
				} else {
					if ($sa[0] === '') {
						if ($sa[1] === '') {
							$dw = $sw;
							$dh = $sh;
						} else {
							$dh = intval($sa[1]);
							$dw = round($sw * $dh / $sh);
						}
					} else {
						$dw = intval($sa[0]);
						if ($sa[1] === '') {
							$dh = round($sh * $dw / $sw);
						} else {
							$dh = intval($sa[1]);
						}
					}
				}
				// calculate the origin point of source image
				// we have a cropped image of dimension $sw, $sh and need to make new with dimension $dw, $dh
				$min = min($sw / $dw, $sh / $dh);
				$w2 = round($dw * $min);
				$h2 = round($dh * $min);
				$sx = round($sx + ($sw - $w2) / 2);
				$sy = round($sy + ($sh - $h2) / 2);
			}
			// create destination image
			$maxWidth = Q_Config::get('Q', 'images', 'maxWidth', null);
			$maxHeight = Q_Config::get('Q', 'images', 'maxHeight', null);
			if (isset($maxWidth) and $dw > $maxWidth) {
				throw new Q_Exception("Image width exceeds maximum width of $dw");
			}
			if (isset($maxHeight) and $dh > $maxHeight) {
				throw new Q_Exception("Image height exceeds maximum height of $dh");
			}
			$thumb = imagecreatetruecolor($dw, $dh);
			imagesavealpha($thumb, true);
			imagealphablending($thumb, false);
			$res = ($w2 === $dw && $h2 === $dh)
				? imagecopy($thumb, $image, 0, 0, $sx, $sy, $w2, $h2)
				: imagecopyresampled($thumb, $image, 0, 0, $sx, $sy, $dw, $dh, $w2, $h2);
			if (!$res) {
				throw new Q_Exception("Failed to save image file of type '$ext'");
			}
			
			if ($dw === $dh and !$square) {
				// save symlinks when possible, instead of copying large images
				$squarefilename = $writePath."$dw.$ext";
				if (file_exists($squarefilename)) {
					Q_Utils::symlink($squarefilename, $writePath.$name);
					continue;
				}
			}
			if ($merge) {
				$mergethumb = imagecreatetruecolor($mw, $mh);
				imagesavealpha($mergethumb, false);
				imagealphablending($mergethumb, false);
				if (imagecopyresized($mergethumb, $merge, 0, 0, 0, 0, $dw, $dh, $mw, $mh)) {
					imagecopy($thumb, $mergethumb, 0, 0, 0, 0, $dw, $dh);
				}
			}
			switch ($ext) {
				case 'jpeg':
				case 'jpg':
					$func = 'imagejpeg';
					break;
				case 'gif':
					$func = 'imagegif';
					break;
				case 'png':
				default:
					$func = 'imagepng';
					break;
			}
			if ($res = call_user_func($func, $thumb, $writePath.$name)) {
				$data[$size] = $subpath ? "$path/$subpath/$name" : "$path/$name";
			}
			if ($dw > $dwMax and $size !== 'x') {
				$dwMax = $dw;
				$data['largestWidthSize'] = $size;
			}
			if ($dh > $dhMax and $size !== 'x') {
				$dhMax = $dh;
				$data['largestHeightSize'] = $size;
			}
		}
		$data[''] = $subpath ? "$path/$subpath" : "$path";
		$data['writePath'] = $writePath;
		$data['ext'] = $ext;

		/**
		 * @event Q/image/save {after}
		 * @param {string} user
		 * @param {string} path
		 * @param {string} subpath
		 * @param {string} writePath
		 * @param {string} data
		 */
		Q::event(
			'Q/image/save', 
			@compact('path', 'subpath', 'writePath', 'data', 'save', 'crop', 'ext'),
			'after'
		);
		return $data;
	}
	
	/**
	 * Call this when handling an HTTP request that submitted the image,
	 * either in the $_FILES superglobal or pass inside the "data" parameter.
	 * You can also override any of the parameters from the request, by passing them in.
	 * @method saveFromRequest
	 * @param {array} [$params] Parameters that can come from the request
	 *   @param {string} [$params.icon.data]  Required if $_FILES is empty. Base64-encoded  data URI - see RFC 2397
	 *   @param {string} [$params.icon.path="Q/uploads"] parent path under web dir (see subpath)
	 *   @param {string} [$params.icon.subpath=""] subpath that should follow the path, to save the image under
	 *   @param {string} [$params.icon.merge=""] path under web dir for an optional image to use as a background
	 *   @param {string} [$params.icon.crop] array with keys "x", "y", "w", "h" to crop the original image
	 * @param {string} [$params.save='x'] name of config under Q/image/sizes, which
	 *  are an array of $size => $basename pairs
	 *  where the size is of the format "WxH", and either W or H can be empty.
	 *  These are stored in the config for various types of images, 
	 *  and you pass the name of the config, so that e.g. clients can't simply
	 *  specify their own sizes.
	 * @return {array} Information about the saved image
	 */
	function saveFromRequest($params = null)
	{
		return Q::event('Q/image/post', $params);
	}
	
	/**
	 * Resizes an image file and saves it as another file
	 * @method resize
	 * @static
	 * @param {string} $in_filename The filename of image to load.
	 * @param {string} $out_filename Where to save the result. The extension determines the file type to save.
	 * @param {array} $sizes An array of options, including:
	 *  "width": this lets you specify the width of the result
	 *  "height": this lets you specify the height of the result
	 *  "width_max": this lets you specify the max width of the result
	 *  "height_max": this lets you specify the max height of the result
	 * @return {boolean} Whether the result was saved successfully
	 */
	static function resize($in_filename, $out_filename, $sizes)
	{
		$gis = getimagesize($in_filename);
		$type = $gis[2];
		switch ($type) {
			case IMAGETYPE_GIF: $image = imagecreatefromgif($in_filename); break;
			case IMAGETYPE_PNG: $image = imagecreatefrompng($in_filename); break;
			case IMAGETYPE_JPEG:
			default: $image = imagecreatefromjpeg($in_filename); break;
		}

		$w = imagesx($image);
		$h = imagesy($image);
		
		$x = $y = 0;
		if (!empty($sizes['width'])) {
			$w2 = $sizes['width'];
			$h2 = !empty($sizes['height']) ? $sizes['height'] : $h * $w2 / $w;
		} else if (!empty($sizes['height'])) {
			$h2 = $sizes['height'];
			$w2 = !empty($sizes['width']) ? $sizes['width'] : $w * $h2 / $h;
		} else {
			$h2 = $h;
			$w2 = $w;
		}
		if (!empty($sizes['width_max']) and $w2 > $sizes['width_max']) {
			$h2 = $h2 * $sizes['width_max'] / $w2;
			$w2 = $sizes['width_max'];
		}
		if (!empty($sizes['height_max']) and $h2 > $sizes['height_max']) {
			$w2 = $w2 * $sizes['height_max'] / $h2;
			$h2 = $sizes['height_max'];
		}
		if ($w * $h2 < $h * $w2) {
			// height shrank by more than width
			$x = 0;
			$y = ($h - $h2 * $w / $w2) / 2;
			$h = $h - $y * 2;
		} else {
			// width shrank by more than height
			$y = 0;
			$x = ($w - $w2 * $h / $h2) / 2;
			$w = $w - $x * 2;
		}
		$out = imagecreatetruecolor($w2,$h2);
		$pi = pathinfo($out_filename);
		if (!imagecopyresampled($out, $image , 0, 0, $x, $y, $w2, $h2, $w, $h)) {
			return false;
		}
		switch (mb_strtolower($pi['extension'], 'UTF-8')) {
			case 'jpg':
			case 'jpeg':
				return !!imagejpeg($out, $out_filename);
			case 'gif':
				return !!imagegif($out, $out_filename);
			case 'png':
			default:
				return !!imagepng($out, $out_filename);
		}
	}
	
	static function isJPEG(&$imageData)
	{
		return (bin2hex($imageData[0]) == 'ff' && bin2hex($imageData[1]) == 'd8');
	}

	static function isPNG(&$imageData)
	{
		return (bin2hex($imageData[0]) == '89' && $imageData[1] == 'P' && $imageData[2] == 'N' && $imageData[3] == 'G');
	}
	
	/*-----------------------------------------------------------------------------
	Handy function for converting hus/sat/lum color values to RGB, which makes it
	very easy to generate random-yet-still-vibrant colors.
	-----------------------------------------------------------------------------*/
	/**
	 * Handy function for converting hus/sat/lum color values to RGB, which makes it
	 * very easy to generate random-yet-still-vibrant colors
	 * @method hsl2rgb
	 * @static
	 * @private
	 * @param {integer} $h
	 * @param {integer} $s
	 * @param {integer} $l
	 * @return {array} RGB vlue as array($R, $G, $B)
	 */

	private static function hsl2rgb ($h, $s, $l) 
	{
		if ($h>240 || $h<0) return array(0,0,0);
		if ($s>240 || $s<0) return array(0,0,0);
		if ($l>240 || $l<0) return array(0,0,0);	 
		if ($h<=40) {
			$R=255;
			$G=(int)($h/40*256);
			$B=0;
		} elseif ($h>40 && $h<=80) {
			$R=(1-($h-40)/40)*256;
			$G=255;
			$B=0;
		} elseif ($h>80 && $h<=120) {
			$R=0;
			$G=255;
			$B=($h-80)/40*256;
		} elseif ($h>120 && $h<=160) {
			$R=0;
			$G=(1-($h-120)/40)*256;
			$B=255;
		} elseif ($h>160 && $h<=200) {
			$R=($h-160)/40*256;
			$G=0;
			$B=255;
		} elseif ($h>200) {
			$R=255;
			$G=0;
			$B=(1-($h-200)/40)*256;
		}
		$R=$R+(240-$s)/240*(128-$R);
		$G=$G+(240-$s)/240*(128-$G);
		$B=$B+(240-$s)/240*(128-$B);
		if ($l<120) {
			$R=($R/120)*$l;
			$G=($G/120)*$l;
			$B=($B/120)*$l;
		} else {
			$R=$l*((256-$R)/120)+2*$R-256;
			$G=$l*((256-$G)/120)+2*$G-256;
			$B=$l*((256-$B)/120)+2*$B-256;
		}
		if ($R<0) $R=0;
		if ($R>255) $R=255;
		if ($G<0) $G=0;
		if ($G>255) $G=255;
		if ($B<0) $B=0;
		if ($B>255) $B=255;
		return array((int)$R,(int)$G,(int)$B);
	}

	/**
	 * Helper function for building a wavatar.  This loads an image and adds it to 
	 * our composite using the given color values.
	 * @method applyImage
	 * @static
	 * @private
	 * @param {GDImageLink} $base
	 * @param {string} $part
	 */

	static private function applyImage ($base, $part)
	{
		$file = Q_FILES_DIR.DS.'Q'.DS.'icons'.DS.$part.'.png';
		$size = @getimagesize($file);
		$im = @imagecreatefrompng($file);
		if(!$im) return;
		imagesavealpha($im, true);
		imagecopyresampled($base,$im,0,0,0,0,Q_AVATAR_SIZE,Q_AVATAR_SIZE,$size[0],$size[1]);
		imagedestroy($im);
	}

	/**
	 * generate sprite for corners and sides
	 * @method getSprite
	 * @static
	 * @private
	 * @param {integer} $shape
	 * @param {integer} $R
	 * @param {integer} $G
	 * @param {integer} $B
	 * @param $rotation {integer}
	 * @return {GDImageLink}
	 */
	static private function getSprite($shape, $R, $G, $B, $rotation) {
		$sprite=imagecreatetruecolor(Q_SPRITE_Z, Q_SPRITE_Z);
		imageantialias($sprite, TRUE);
		$fg=imagecolorallocate($sprite, $R, $G, $B);
		$bg=imagecolorallocate($sprite, 255, 255, 255);
		imagefilledrectangle($sprite, 0, 0, Q_SPRITE_Z, Q_SPRITE_Z, $bg);
		switch($shape) {
			case 0: // triangle
				$shape=array(0.5,1,1,0,1,1);
				break;
			case 1: // parallelogram
				$shape=array(0.5,0,1,0,0.5,1,0,1);
				break;
			case 2: // mouse ears
				$shape=array(0.5,0,1,0,1,1,0.5,1,1,0.5);
				break;
			case 3: // ribbon
				$shape=array(0,0.5,0.5,0,1,0.5,0.5,1,0.5,0.5);
				break;
			case 4: // sails
				$shape=array(0,0.5,1,0,1,1,0,1,1,0.5);
				break;
			case 5: // fins
				$shape=array(1,0,1,1,0.5,1,1,0.5,0.5,0.5);
				break;
			case 6: // beak
				$shape=array(0,0,1,0,1,0.5,0,0,0.5,1,0,1);
				break;
			case 7: // chevron
				$shape=array(0,0,0.5,0,1,0.5,0.5,1,0,1,0.5,0.5);
				break;
			case 8: // fish
				$shape=array(0.5,0,0.5,0.5,1,0.5,1,1,0.5,1,0.5,0.5,0,0.5);
				break;
			case 9: // kite
				$shape=array(0,0,1,0,0.5,0.5,1,0.5,0.5,1,0.5,0.5,0,1);
				break;
			case 10: // trough
				$shape=array(0,0.5,0.5,1,1,0.5,0.5,0,1,0,1,1,0,1);
				break;
			case 11: // rays
				$shape=array(0.5,0,1,0,1,1,0.5,1,1,0.75,0.5,0.5,1,0.25);
				break;
			case 12: // double rhombus
				$shape=array(0,0.5,0.5,0,0.5,0.5,1,0,1,0.5,0.5,1,0.5,0.5,0,1);
				break;
			case 13: // crown
				$shape=array(0,0,1,0,1,1,0,1,1,0.5,0.5,0.25,0.5,0.75,0,0.5,0.5,0.25);
				break;
			case 14: // radioactive
				$shape=array(0,0.5,0.5,0.5,0.5,0,1,0,0.5,0.5,1,0.5,0.5,1,0.5,0.5,0,1);
				break;
			default: // tiles
				$shape=array(0,0,1,0,0.5,0.5,0.5,0,0,0.5,1,0.5,0.5,1,0.5,0.5,0,1);
				break;
		}
		/* apply ratios */
		for ($i=0;$i<count($shape);$i++)
			$shape[$i]=$shape[$i]*Q_SPRITE_Z;
		imagefilledpolygon($sprite, $shape, count($shape)/2, $fg);
		/* rotate the sprite */
		for ($i=0;$i<$rotation;$i++)
			$sprite=imagerotate($sprite,90,$bg);
		return $sprite;
	}

	/**
	 * generate sprite for center block
	 * @method getCenter
	 * @static
	 * @private
	 * @param {integer} $shape
	 * @param {integer} $fR
	 * @param {integer} $fG
	 * @param {integer} $fB
	 * @param {integer} $bR
	 * @param {integer} $bG
	 * @param {integer} $bB
	 * @param {integer} $usebg
	 * @return {GDImageLink}
	 */
	static private function getCenter($shape, $fR, $fG, $fB, $bR, $bG, $bB, $usebg) {
		$sprite=imagecreatetruecolor(Q_SPRITE_Z,Q_SPRITE_Z);
		imageantialias($sprite,TRUE);
		$fg=imagecolorallocate($sprite,$fR,$fG,$fB);
		/* make sure there's enough contrast before we use background color of side sprite */
		if ($usebg>0 && (abs($fR-$bR)>127 || abs($fG-$bG)>127 || abs($fB-$bB)>127))
			$bg=imagecolorallocate($sprite,$bR,$bG,$bB);
		else
			$bg=imagecolorallocate($sprite,255,255,255);
		imagefilledrectangle($sprite,0,0,Q_SPRITE_Z,Q_SPRITE_Z,$bg);
		switch($shape) {
			case 0: // empty
				$shape=array();
				break;
			case 1: // fill
				$shape=array(0,0,1,0,1,1,0,1);
				break;
			case 2: // diamond
				$shape=array(0.5,0,1,0.5,0.5,1,0,0.5);
				break;
			case 3: // reverse diamond
				$shape=array(0,0,1,0,1,1,0,1,0,0.5,0.5,1,1,0.5,0.5,0,0,0.5);
				break;
			case 4: // cross
				$shape=array(0.25,0,0.75,0,0.5,0.5,1,0.25,1,0.75,0.5,0.5,0.75,1,0.25,1,0.5,0.5,0,0.75,0,0.25,0.5,0.5);
				break;
			case 5: // morning star
				$shape=array(0,0,0.5,0.25,1,0,0.75,0.5,1,1,0.5,0.75,0,1,0.25,0.5);
				break;
			case 6: // small square
				$shape=array(0.33,0.33,0.67,0.33,0.67,0.67,0.33,0.67);
				break;
			case 7: // checkerboard
				$shape=array(0,0,0.33,0,0.33,0.33,0.66,0.33,0.67,0,1,0,1,0.33,0.67,0.33,0.67,0.67,1,0.67,1,1,0.67,1,0.67,0.67,0.33,0.67,0.33,1,0,1,0,0.67,0.33,0.67,0.33,0.33,0,0.33);
				break;
		}
		/* apply ratios */
		for ($i=0;$i<count($shape);$i++)
			$shape[$i]=$shape[$i]*Q_SPRITE_Z;
		if (count($shape)>0)
			imagefilledpolygon($sprite,$shape,count($shape)/2,$fg);
		return $sprite;
	}

	/**
	 * Builds the avatar.
	 * @method buildWAvatar
	 * @static
	 * @private
	 * @param {integer} $hash
	 * @param {integer} $size
	 * @return {GDImageLink}
	 */
	static private function buildWAvatar ($hash, $size)
	{
		if ($size > Q_AVATAR_SIZE) $size = Q_AVATAR_SIZE;
		$face =		 1 + (hexdec (substr ($hash,  1, 2)) % (Q_WAVATAR_FACES));
		$bg_color =		 (hexdec (substr ($hash,  3, 2)) % 240);
		$fade =		 1 + (hexdec (substr ($hash,  5, 2)) % (Q_WAVATAR_BACKGROUNDS));
		$wav_color =		(hexdec (substr ($hash,  7, 2)) % 240);
		$brow =		 1 + (hexdec (substr ($hash,  9, 2)) % (Q_WAVATAR_BROWS));
		$eyes =		 1 + (hexdec (substr ($hash, 11, 2)) % (Q_WAVATAR_EYES));
		$pupil =		1 + (hexdec (substr ($hash, 13, 2)) % (Q_WAVATAR_PUPILS));
		$mouth =		1 + (hexdec (substr ($hash, 15, 2)) % (Q_WAVATAR_MOUTHS));
		// create backgound
		$avatar = imagecreatetruecolor (Q_AVATAR_SIZE, Q_AVATAR_SIZE);
		//Pick a random color for the background
		$c = self::hsl2rgb ($bg_color, 240, 50);
		$bg = imagecolorallocate ($avatar, $c[0], $c[1], $c[2]);
		imagefill($avatar,0,0,$bg);
		$c = self::hsl2rgb ($wav_color, 240, 170);
		$bg = imagecolorallocate ($avatar, $c[0], $c[1], $c[2]);
		//Now add the various layers onto the image
		self::applyImage ($avatar, "wavatar".DS."fade$fade");
		self::applyImage ($avatar, "wavatar".DS."mask$face");
		imagefill($avatar, Q_AVATAR_SIZE / 2,Q_AVATAR_SIZE / 2,$bg);
		self::applyImage ($avatar, "wavatar".DS."shine$face");
		self::applyImage ($avatar, "wavatar".DS."brow$brow");
		self::applyImage ($avatar, "wavatar".DS."eyes$eyes");
		self::applyImage ($avatar, "wavatar".DS."pupils$pupil");
		self::applyImage ($avatar, "wavatar".DS."mouth$mouth");
		//resize if needed
		if ($size != Q_AVATAR_SIZE) {
			$out = imagecreatetruecolor($size,$size);
			imagecopyresampled ($out,$avatar, 0, 0, 0, 0, $size, $size, Q_AVATAR_SIZE, Q_AVATAR_SIZE);
			imagedestroy($avatar);
			return $out;
		} else {
			return $avatar;
		}
	}

	/**
	 * Builds the avatar.
	 * @method buildIAvatar
	 * @static
	 * @private
	 * @param {integer} $hash
	 * @param {integer} $size
	 * @return {GDImageLink}
	 */
	static private function buildIAvatar ($hash, $size) {

		if ($size > Q_AVATAR_SIZE) $size = Q_AVATAR_SIZE;
		$csh=hexdec(substr($hash,0,1)); // corner sprite shape
		$ssh=hexdec(substr($hash,1,1)); // side sprite shape
		$xsh=hexdec(substr($hash,2,1))&7; // center sprite shape

		$cro=hexdec(substr($hash,3,1))&3; // corner sprite rotation
		$sro=hexdec(substr($hash,4,1))&3; // side sprite rotation
		$xbg=hexdec(substr($hash,5,1))%2; // center sprite background

		/* corner sprite foreground color */
		$cfr=hexdec(substr($hash,6,2));
		$cfg=hexdec(substr($hash,8,2));
		$cfb=hexdec(substr($hash,10,2));

		/* side sprite foreground color */
		$sfr=hexdec(substr($hash,12,2));
		$sfg=hexdec(substr($hash,14,2));
		$sfb=hexdec(substr($hash,16,2));

		/* final angle of rotation */
		$angle=hexdec(substr($hash,18,2));

		/* start with blank 3x3 identicon */
		$identicon=imagecreatetruecolor(Q_SPRITE_Z*3,Q_SPRITE_Z*3);
		imageantialias($identicon,TRUE);

		/* assign white as background */
		$bg=imagecolorallocate($identicon,255,255,255);
		imagefilledrectangle($identicon,0,0,Q_SPRITE_Z,Q_SPRITE_Z,$bg);

		/* generate corner sprites */
		$corner=self::getSprite($csh,$cfr,$cfg,$cfb,$cro);
		imagecopy($identicon,$corner,0,0,0,0,Q_SPRITE_Z,Q_SPRITE_Z);
		$corner=imagerotate($corner,90,$bg);
		imagecopy($identicon,$corner,0,Q_SPRITE_Z*2,0,0,Q_SPRITE_Z,Q_SPRITE_Z);
		$corner=imagerotate($corner,90,$bg);
		imagecopy($identicon,$corner,Q_SPRITE_Z*2,Q_SPRITE_Z*2,0,0,Q_SPRITE_Z,Q_SPRITE_Z);
		$corner=imagerotate($corner,90,$bg);
		imagecopy($identicon,$corner,Q_SPRITE_Z*2,0,0,0,Q_SPRITE_Z,Q_SPRITE_Z);

		/* generate side sprites */
		$side=self::getSprite($ssh,$sfr,$sfg,$sfb,$sro);
		imagecopy($identicon,$side,Q_SPRITE_Z,0,0,0,Q_SPRITE_Z,Q_SPRITE_Z);
		$side=imagerotate($side,90,$bg);
		imagecopy($identicon,$side,0,Q_SPRITE_Z,0,0,Q_SPRITE_Z,Q_SPRITE_Z);
		$side=imagerotate($side,90,$bg);
		imagecopy($identicon,$side,Q_SPRITE_Z,Q_SPRITE_Z*2,0,0,Q_SPRITE_Z,Q_SPRITE_Z);
		$side=imagerotate($side,90,$bg);
		imagecopy($identicon,$side,Q_SPRITE_Z*2,Q_SPRITE_Z,0,0,Q_SPRITE_Z,Q_SPRITE_Z);

		/* generate center sprite */
		$center=self::getCenter($xsh,$cfr,$cfg,$cfb,$sfr,$sfg,$sfb,$xbg);
		imagecopy($identicon,$center,Q_SPRITE_Z,Q_SPRITE_Z,0,0,Q_SPRITE_Z,Q_SPRITE_Z);

		// $identicon=imagerotate($identicon,$angle,$bg);

		/* make white transparent */
		imagecolortransparent($identicon,$bg);

		/* create blank image according to specified dimensions */
		$resized=imagecreatetruecolor($size,$size);
		imageantialias($resized,TRUE);

		/* assign white as background */
		$bg=imagecolorallocate($resized,255,255,255);
		imagefilledrectangle($resized,0,0,$size,$size,$bg);

		/* resize identicon according to specification */
		imagecopyresampled($resized,$identicon,0,0,(imagesx($identicon)-Q_SPRITE_Z*3)/2,(imagesx($identicon)-Q_SPRITE_Z*3)/2,$size,$size,Q_SPRITE_Z*3,Q_SPRITE_Z*3);

		/* make white transparent */
		imagecolortransparent($resized,$bg);

		return $resized;
	}

	/**
	 * Builds the avatar.
	 * @method buildIAvatar
	 * @static
	 * @private
	 * @param {integer} $hash
	 * @param {integer} $size
	 * @return {GDImageLink}
	 */
	static private function buildMAvatar($hash, $size){
		// init random seed
		if($hash) srand(hexdec(substr($hash,0,6)));

		// throw the dice for body parts
		$parts = array(
			'legs' => rand(1,Q_MAVATAR_LEGS),
			'hair' => rand(1,Q_MAVATAR_HAIR),
			'arms' => rand(1,Q_MAVATAR_ARMS),
			'body' => rand(1,Q_MAVATAR_BODY),
			'eyes' => rand(1,Q_MAVATAR_EYES),
			'mouth'=> rand(1,Q_MAVATAR_MOUNTH)
		);

		// create backgound
		$monster = imagecreatetruecolor(Q_AVATAR_SIZE, Q_AVATAR_SIZE);
		$white   = imagecolorallocate($monster, 255, 255, 255);
		imagefill($monster,0,0,$white);
		// add parts
		foreach($parts as $part => $num){
			self::applyImage($monster, "monster".DS.$part.'_'.$num);
		   // color the body
			if($part == 'body'){
				$color = imagecolorallocate($monster, rand(20,235), rand(20,235), rand(20,235));
				imagefill($monster,Q_AVATAR_SIZE/2,Q_AVATAR_SIZE/2,$color);
			}
		}
		// restore random seed
		srand();
		// resize if needed, then output
		if ($size && $size < Q_AVATAR_SIZE){
			$out = imagecreatetruecolor($size,$size);
			imagecopyresampled($out,$monster,0,0,0,0,$size,$size,Q_AVATAR_SIZE,Q_AVATAR_SIZE);
			imagedestroy($monster);
			return $out;
		} else{
			return $monster;
		}
	}
}