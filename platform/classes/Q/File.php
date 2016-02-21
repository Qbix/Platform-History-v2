<?php

/**
 * @module Q
 */

/**
 * Q File class
 * @class Q_File
 */
class Q_File
{	
	/**
	 * Saves a file, usually sent by the client
	 * @method save
	 * @static
	 * @param {array} $params 
	 * @param {string} [$params.data] the file data
	 * @param {string} [$params.path="uploads"] parent path under web dir (see subpath)
	 * @param {string} [$params.subpath=""] subpath that should follow the path, to save the image under
	 * @param {string} [$params.name] override the name of the file, after the subpath
	 * @param {string} [$params.skipAccess=false] if true, skips the check for authorization to write files there
	 * @return {array} Returns array containing ($name => $tailUrl) pair
	 */
	static function save($params)
	{
		if (empty($params['data'])) {
			throw new Q_Exception(array('field' => 'file'), 'data');
		}
		
		// check whether we can write to this path, and create dirs if needed
		$data = $params['data'];
		$path = isset($params['path']) ? $params['path'] : 'uploads';
		$subpath = isset($params['subpath']) ? $params['subpath'] : '';
		$realPath = Q::realPath(APP_WEB_DIR.DS.$path);
		if ($realPath === false) {
			throw new Q_Exception_MissingFile(array(
				'filename' => APP_WEB_DIR.DS.$path
			));
		}
		$name = isset($params['name']) ? $params['name'] : 'file';
		if (!preg_match('/^[\w.-]+$/', $name)) {
			$info = pathinfo($name);
			$name = Q_Utils::normalize($info['filename']) . '.' . $info['extension'];
		}
		// TODO: recognize some extensions maybe
		$writePath = $realPath.($subpath ? DS.$subpath : '');
		$lastChar = substr($writePath, -1);
		if ($lastChar !== DS and $lastChar !== '/') {
			$writePath .= DS;
		}
		$throwIfNotWritable = empty($params['skipAccess']) ? true : null;
		Q_Utils::canWriteToPath($writePath, $throwIfNotWritable, true);
		file_put_contents($writePath.DS.$name, $data);

		$tailUrl = $subpath ? "$path/$subpath/$name" : "$path/$name";

		/**
		 * @event Q/file/save {after}
		 * @param {string} user
		 * @param {string} path
		 * @param {string} subpath
		 * @param {string} name
		 * @param {string} writePath
		 * @param {string} data
		 */
		Q::event(
			'Q/file/save', 
			compact('path', 'subpath', 'name', 'writePath', 'data', 'tailUrl'),
			'after'
		);
		return array($name => $tailUrl);
	}
	
	/**
	 * Resizes an image file and saves it as another file
	 * @method resize
	 * @static
	 * @param $in_filename {string} The filename of image to load.
	 * @param $out_filename {string} Where to save the result. The extension determines the file type to save.
	 * @param $sizes {array} An array of options, including:
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
		switch (strtolower($pi['extension'])) {
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
	 * @param $h {integer}
	 * @param $s {integer}
	 * @param $l {integer}
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
	 * @param $base {GDImageLink}
	 * @param $part {string}
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
	 * @param $shape {integer}
	 * @param $R {integer}
	 * @param $G {integer}
	 * @param $B {integer}
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
	 * @param $shape {integer}
	 * @param $fR {integer}
	 * @param $fG {integer}
	 * @param $fB {integer}
	 * @param $bR {integer}
	 * @param $bG {integer}
	 * @param $bB {integer}
	 * @param $usebg {integer}
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
	 * @param $hash {integer}
	 * @param $size {integer}
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
	 * @param $hash {integer}
	 * @param $size {integer}
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
	 * @param $hash {integer}
	 * @param $size {integer}
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