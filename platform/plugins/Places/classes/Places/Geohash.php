<?php
/**
 * Geohash
 *
 * @author      Keisuke SATO
 * @license     MIT License
 * 
 * # Based
 * http://github.com/davetroy/geohash-js/blob/master/geohash.js
 * Geohash library for Javascript
 * Copyright © 2008 David Troy, Roundhouse Technologies LLC
 * Distributed under the MIT License
 **/
class Places_Geohash
{
    static private $bits = array(16, 8, 4, 2, 1);
    static private $base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    static private $neighbors = array(
        'top' => array('even' => 'bc01fg45238967deuvhjyznpkmstqrwx',),
        'bottom' => array('even' => '238967debc01fg45kmstqrwxuvhjyznp',),
        'right' => array('even' => 'p0r21436x8zb9dcf5h7kjnmqesgutwvy',),
        'left' => array('even' => '14365h7k9dcfesgujnmqp0r2twvyx8zb',),
    );
    static private $borders = array(
        'top' => array('even' => 'bcfguvyz'),
        'bottom' => array('even' => '0145hjnp'),
        'right' => array('even' => 'prxz'),
        'left' => array('even' => '028b'),
    );
    
    /**
     * Call this function to calculate a hash from latitude, longitude
     * @method encode
     * @static
	 * @param {float} $latitude
	 * @param {float} $longitude
	 * @param {integer} [$length] Optional length of the resulting geohash
	 * @return {string}
     */
    static public function encode($latitude, $longtitude, $length = null){
        /***
            eq('xpssc0', Places_Geohash::encode(43.025, 141.377));
            eq('xn76urx4dzxy', Places_Geohash::encode(35.6813177190391, 139.7668218612671));
        */
        $is_even = true;
        $bit = 0;
        $ch = 0;
		if (!isset($length)) {
			$lenLat = strlen(strstr($latitude, '.'));
			$lenLong = strlen(strstr($longtitude, '.'));
			$length = min(12, (max($lenLat, $lenLong) - 1) * 2);
		}
        $geohash = '';
        
        $lat = array(-90.0, 90.0);
        $lon = array(-180.0, 180.0);
        
        while(strlen($geohash) < $length){
            if($is_even){
                $mid = array_sum($lon) / 2;
                if($longtitude > $mid){
                    $ch |= self::$bits[$bit];
                    $lon[0] = $mid;
                } else {
                    $lon[1] = $mid;
                }
            } else {
                $mid = array_sum($lat) / 2;
                if($latitude > $mid){
                    $ch |= self::$bits[$bit];
                    $lat[0] = $mid;
                } else {
                    $lat[1] = $mid;
                }
            }
            $is_even = !$is_even;
            if($bit < 4){
                $bit++;
            } else {
                $geohash .= self::$base32[$ch];
                $bit = 0;
                $ch = 0;
            }
        }
        return $geohash;
    }
    
    /**
     * Call this function to decode hashes
     * @method decode
     * @static
	 * @param {string} $geohash the hash to decode
	 * @return {array}
     */
    static public function decode($geohash){
        /***
            list($latitude, $longtitude) = Places_Geohash::decode('xpssc0');
            eq(array(43.0224609375, 43.027954101562, 43.025207519531), $latitude);
            eq(array(141.3720703125, 141.38305664062, 141.37756347656), $longtitude);
        */
        $is_even = true;
        $lat = array(-90.0, 90.0);
        $lon = array(-180.0, 180.0);
        $lat_err = 90.0;
        $lon_err = 180.0;
		$len = strlen($geohash);
        for($i=0; $i<$len; $i++){
            $c = $geohash[$i];
            $cd = stripos(self::$base32, $c);
            for($j=0; $j<5; $j++){
                $mask = self::$bits[$j];
                if($is_even){
                    $lon_err /= 2;
                    self::refine_interval($lon, $cd, $mask);
                } else {
                    $lat_err /= 2;
                    self::refine_interval($lat, $cd, $mask);
                }
                $is_even = !$is_even;
            }
        }
        $lat[2] = ($lat[0] + $lat[1]) / 2;
        $lon[2] = ($lon[0] + $lon[1]) / 2;
        
        return array($lat, $lon);
    }
    
    /**
     * Call this function to find adjacent hashes
     * @method adjacent
     * @static
	 * @param {string} $hash currently only works for hashes of even length
	 * @param {string} $dir could be "top", "right", "bottom", "left"
	 * @return {string}
     */
    static function adjacent($hash, $dir){
        /***
            eq('xne', Places_Geohash::adjacent('xn7', 'top'));
            eq('xnk', Places_Geohash::adjacent('xn7', 'right'));
            eq('xn5', Places_Geohash::adjacent('xn7', 'bottom'));
            eq('xn6', Places_Geohash::adjacent('xn7', 'left'));
        */
        $hash = strtolower($hash);
        $last = substr($hash, -1);
        // $type = (strlen($hash) % 2)? 'odd': 'even';
        $type = 'even'; //FIXME
        $base = substr($hash, 0, strlen($hash) - 1);
        if(strpos(self::$borders[$dir][$type], $last) !== false){
            $base = self::adjacent($base, $dir);
        }
		$neighbors = strpos(self::$neighbors[$dir][$type], $last);
        return $base. self::$base32[$neighbors];
    }
    
    static private function refine_interval(&$interval, $cd, $mask){
        $interval[($cd & $mask)? 0: 1] = ($interval[0] + $interval[1]) / 2;
    }

    /**
     * Use this method to fetch database rows and order them by geohash distance
     * from a given center.
     * @method fetchByDistance
     * @static
     * @param {Db_Query} $query A database query, generated with Table_Class::select(),
     *  to extend and run fetchDbRows() on
     * @param {string} $field The name of the field to test
     * @param {string} $center A geohash that represents the center point
     * @param {integer} $limit The number of items to return, at most
     * @return {array} An array of Db_Row objects sorted by increasing distance from center
     */
    static function fetchByDistance($query, $field, $center, $limit)
    {
    	$above = (clone $query)->where(array(
	        $field => new Db_Range($center, true, false, null)
	    ))->orderBy($field, true)->fetchDbRows();
	    $below = (clone $query)->where(array(
		    $field => new Db_Range(null, false, false, $center)
	    ))->orderBy($field, false)->fetchDbRows();
    	$result = array();
    	$i = $j = $k = 0;
    	$a = count($above);
    	$b = count($below);
    	while ($k < $limit && $i < $a) {
    		while ($j < $b) {
    			if (self::closer($center, $above[$i], $below[$j])) {
    				$result[] = $above[$i];
    				++$i;
			    } else {
    				$result[] = $below[$j];
    				++$j;
			    }
		    }
		    ++$k;
	    }
	    while ($k < $limit && $j < $b) {
    		$result[] = $below[$j];
    		++$j;
	    }

    }

    private function closer($center, $a, $b) {
    	$cn = self::alpha2num($center);
    	$an = self::alpha2num($a);
    	$bn = self::alpha2num($b);
    	return abs($an - $cn) < abs($bn - $cn);
    }

	/**
	 * Converts an alphabetic string into an integer.
	 * @param int $n This is the number to convert.
	 * @return string The converted number.
	 * @author Theriault
	 */
	private function alpha2num($a) {
		$r = 0;
		$l = strlen($a);
		for ($i = 0; $i < $l; $i++) {
			$r += pow(26, $i) * (ord($a[$l - $i - 1]) - 0x30);
		}
		return $r;
	}
}