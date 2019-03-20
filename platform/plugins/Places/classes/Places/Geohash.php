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
                $geohash .= self::$base32{$ch};
                $bit = 0;
                $ch = 0;
            }
        }
        return $geohash;
    }
    
    /**
     * Call this function to decode hashes
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
            $c = $geohash{$i};
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
}