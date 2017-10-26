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
	 * Download an image from pixabay
	 * @param {string} $keywords Specify some string to search images on pixabay
	 * @param {array} [$options=array()] Any additional options for pixabay api as per its documentation
	 * @param {boolean} [$returnFirstImage=false] If true, downloads and returns the first image as data
	 * @return {string} JSON according to pixabay api documentation
	 */
	static function pixabay($keywords, $options = array(), $returnFirstImage = false)
	{
		$info = Q_Config::get('Q', 'images', 'pixabay', null);
		if (!$info['key']) {
			throw new Q_Exception_MissingConfig(array('fieldpath' => 'Q/images/pixabay/key'));
		}
		$key = $info['key'];
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
		$data = @file_get_contents($webformatUrl);
		return $data;
	}

	/**
	 * Saves an avatar image, in a certain size. Can check gravatar.com for avatar
	 * @method put
	 * @static
	 * @param {string} $filename The name of image file
	 * @param {string} $hash The md5 hash to build avatar
	 * @param {integer} [$size=Q_AVATAR_SIZE] Avatar size in pixels
	 * @param {string} [$type='wavatar'] Type of avatar - one of 'wavatar', 'monster', 'imageid'
	 * @param {boolean} [$gravatar=false]
	 * @return {GDImageLink}
     * @throws {Q_Exception} If GD is not supported
     * @throws {Q_Exception_WrongValue} If avatar type is not supported
	 */
	static function put($filename, $hash, $size = Q_AVATAR_SIZE, $type = 'wavatar', $gravatar = false) {
		$result = self::avatar($hash, $size, $type, $gravatar);
		if ($gravatar) {
			file_put_contents($filename, $result);
		} else {
			imagepng($result, $filename);
		}
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
	 * @param {string} [$params.save=array("x" => "")] array of $size => $basename pairs
	 *  where the size is of the format "WxH", and either W or H can be empty.
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
		$save = !empty($params['save']) ? $params['save'] : array('x' => '');
		if (!Q::isAssociative($save)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'save',
				'type' => 'associative array'
			));
		}
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
		foreach ($save as $size => $name) {
			if (empty($name)) {
				// generate a filename
				do {
					$name = Q_Utils::unique(8).'.png';
				} while (file_exists($writePath.$name));
			}
			if (strrpos($name, '.') === false) {
				$name .= '.png';
			}
			list($n, $ext) = explode('.', $name);
			$sw = $isw;
			$sh = $ish;
			$sx = $isx;
			$sy = $isy;
			// determine destination image size
			if (!empty($size)) {
				$sa = explode('x', $size);
				if (count($sa) > 1) {
					if ($sa[0] === '') {
						if ($sa[1] === '') {
							$dw = $sw;
							$dh = $sh;
						} else {
							$dh = intval($sa[1]);
							$dw = $sw * $dh / $sh;
						}
					} else {
						$dw = intval($sa[0]);
						if ($sa[1] === '') {
							$dh = $sh * $dw / $sw;
						} else {
							$dh = intval($sa[1]);
						}
					}
				} else {
					$dw = $dh = intval($sa[0]);
				}
				// calculate the origin point of source image
				// we have a cropped image of dimension $sw, $sh and need to make new with dimension $dw, $dh
				if ($dw/$sw < $dh/$sh) {
					// source is wider then destination
					$new = $dw/$dh * $sh;
					$sx += round(($sw - $new)/2);
					$sw = round($new);
				} else {
					// source is narrower then destination
					$new = $dh/$dw * $sw;
					$sy += round(($sh - $new)/2);
					$sh = round($new);
				}
			} else {
				$size = '';
				$dw = $sw;
				$dh = $sh;
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
			$res = ($sw === $dw && $sh === $dh)
				? imagecopy($thumb, $image, 0, 0, $sx, $sy, $sw, $sh)
				: imagecopyresampled($thumb, $image, 0, 0, $sx, $sy, $dw, $dh, $sw, $sh);
			if (!$res) {
				throw new Q_Exception("Failed to save image file of type '$ext'");
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
				case 'jpeg':
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
		}
		$data[''] = $subpath ? "$path/$subpath" : "$path";

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
			compact('path', 'subpath', 'writePath', 'data', 'save', 'crop'), 
			'after'
		);
		return $data;
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
		if($size && $size < Q_AVATAR_SIZE){
			$out = imagecreatetruecolor($size,$size);
			imagecopyresampled($out,$monster,0,0,0,0,$size,$size,Q_AVATAR_SIZE,Q_AVATAR_SIZE);
			imagedestroy($monster);
			return $out;
		}else{
			return $monster;
		}
	}
}