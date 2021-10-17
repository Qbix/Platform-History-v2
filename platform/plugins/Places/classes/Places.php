<?php
/**
 * Places model
 * @module Places
 * @main Places
 */
/**
 * Static methods for the Places models.
 * @class Places
 * @extends Base_Places
 */
abstract class Places extends Base_Places
{
	/*
	 * This is where you would place all the static methods for the models,
	 * the ones that don't strongly pertain to a particular row or table.
	 
	 * * * */

	/* * * */
	
	/**
	 * Get autocomplete results
	 * @method autocomplete
	 * @static
	 * @param {string} $input The text (typically typed by a user) to find completions for
	 * @param {boolean} [$throwIfBadValue=false]
	 *  Whether to throw Q_Exception if the result contains a bad value
	 * @param {array} [$types=array("establishment")] Can include "establishment", "locality", "sublocality", "postal_code", "country", "administrative_area_level_1", "administrative_area_level_2". Set to true to include all types.
	 * @param {double} [$latitude=userLocation] Override the latitude of the coordinates to search around
	 * @param {double} [$longitude=userLocation] Override the longitude of the coordinates to search around
 	 * @param {double} [$meters=40234] Override the radius, in meters, to search around
	 * @return {array} An array of prediction objects from Google Places predictions API
	 * @throws {Q_Exception} if a bad value is encountered and $throwIfBadValue is true
	 */
	static function autocomplete(
		$input, 
		$throwIfBadValue = false,
		$types = null, 
		$latitude = null, 
		$longitude = null,
		$meters = 40234)
	{
		$supportedTypes = array("establishment", "locality", "sublocality", "postal_code", "country", "administrative_area_level_1", "administrative_area_level_2");
		$input = mb_strtolower($input, 'UTF-8');
		if (is_string($types)) {
			$types = explode(',', $types);
		} else if ($types === true) {
			$types = null;
		}
		if ($types) {
			foreach ($types as $type) {
				if (!in_array($type, $supportedTypes)) {
					throw new Q_Exception_BadValue(array(
						'internal' => '$types',
						'problem' => "$type is not supported"
					));
				}
			}
		}
		if (empty($input)) {
			if ($throwIfBadValue) {
				throw new Q_Exception_RequiredField(array('field' => 'input'));
			}
			return null;
		}
		
		if (!isset($latitude) or !isset($longitude)) {
			if ($uls = Places_Location::userStream()) {
				$latitude = $uls->getAttribute('latitude', null);
				$longitude = $uls->getAttribute('longitude', null);
				if (!isset($meters)) {
					$meters = $uls->getAttribute('meters', 40234);
				}
			}
		}
		
		if (!isset($latitude) or !isset($longitude)) {
			// put some defaults
			$latitude = 40.5806032;
			$longitude = -73.9755244;
			$meters = 40234;
		}

		$pa = null;
		if (Q_Config::get('Places', 'cache', 'autocomplete', true)) {
			$pa = new Places_Autocomplete();
			$pa->query = $input;
			$pa->types = $types ? implode(',', $types) : '';
			$pa->latitude = $latitude;
			$pa->longitude = $longitude;
			$pa->meters = $meters;
			if ($pa->retrieve()) {
				$ut = $pa->updatedTime;
				if (isset($ut)) {
					$db = $pa->db();
					$ut = $db->fromDateTime($ut);
					$ct = $db->getCurrentTimestamp();
					$cd = Q_Config::get('Places', 'cache', 'duration', 60*60*24*30);
					if ($ct - $ut < $cd) {
						// there are cached autocomplete results that are still viable
						return Q::json_decode($pa->results, true);
					}
				}
			}
		}

		$key = Q_Config::expect('Places', 'google', 'keys', 'server');
		$location = "$latitude,$longitude";
		$radius = $meters;
		if ($types === null) {
			unset($types);
		}
		$query = http_build_query(@compact('key', 'input', 'types', 'location', 'radius'));
		$url = "https://maps.googleapis.com/maps/api/place/autocomplete/json?$query";
		$json = self::getRemoteContents($url);
		$response = json_decode($json, true);
		if (!empty($response['error_message'])) {
			throw new Q_Exception("Places::autocomplete: ".$response['error_message']);
		}
		if (empty($response['predictions'])) {
			throw new Q_Exception("Places::autocomplete: Couldn't obtain predictions for $input");
		}
		$results = $response['predictions'];
		if ($pa) {
			$pa->results = json_encode($results);
			$pa->save();
		}
		return $results;
	}
	/**
	 * Create valid request to remote server to get contents
	 * @method getRemoteContents
	 * @static
	 * @param {string} $url
	 * @return {string} request result
	 */
	static function getRemoteContents($url)
	{
		$cafile = __DIR__.'/../files/cacert.pem';

		// if url is https://... and certificate file exist
		if (strpos($url, 'https') === 0 && is_file($cafile)) {
			$context = stream_context_create(array(
				'ssl'=>array(
					'cafile' => $cafile,
					'verify_peer' => true,
					'verify_peer_name' => true,
				)
			));
			return file_get_contents($url, false, $context);
		}

		// otherwise return standard file_get_contents
		return file_get_contents($url);
	}
	/**
	 * Use this to calculate the haversine distance between two sets of lat/long coordinates on the Earth
	 * @method distance
	 * @static
	 * @param {double} $lat_1
	 * @param {double} $long_1
	 * @param {double} $lat_2
	 * @param {double} $long_2
	 * @return {double|null} The result, in meters, of applying the haversine formula.
	 *  Returns null if any of the inputs are null.
	 */
	static function distance($lat_1,$long_1,$lat_2,$long_2)
	{
		if (!isset($lat_1) or !isset($long_1)
		or !isset($lat_2) or !isset($long_2)) {
			return null;
		}

		$earth_radius = 6378084.1454; // in meters

		$sin_lat   = sin(deg2rad($lat_2  - $lat_1)  / 2.0);
		$sin2_lat  = $sin_lat * $sin_lat;

		$sin_long  = sin(deg2rad($long_2 - $long_1) / 2.0);
		$sin2_long = $sin_long * $sin_long;

		$cos_lat_1 = cos(deg2rad($lat_1));
		$cos_lat_2 = cos(deg2rad($lat_2));

		$sqrt	  = sqrt($sin2_lat + ($cos_lat_1 * $cos_lat_2 * $sin2_long));
		$distance  = 2.0 * $earth_radius * asin($sqrt);

		return $distance;
	}
	
	/**
	 * Use this method to generate a label for a radius based on a distance in meters
	 * @method distanceLabel
	 * @static
	 * @param {double} $meters
	 * @param {string} [$units] optionally specify 'km', 'kilometers' or 'miles', or null for auto
	 * @return {string} Returns a label that looks like "x.y km", "x miles" or "x meters"
	 */
	static function distanceLabel($meters, $units = 'km')
	{
		if (empty($units)) {
			$milesr = abs($meters/1609.34 - round($meters/1609.34));
			$kmr = abs($meters/1000 - round($meters/1000));
			$units = $milesr < $kmr ? 'miles' : 'km';
		}
		$text = Q_Text::get('Places/content');
		$displayUnits = $text['units'][$units];
		switch ($units) {
		case 'mi':
		case 'miles':
			$mi = intval(round($meters/1609.34*10)/10);
			$mi = $mi==0 ? 1 : $mi;
			if ($mi == 1 and $displayUnits === 'miles') {
				$displayUnits = 'mile';
			}
			return "$mi $displayUnits";
		case 'km':
		case 'kilometers':
		default:
			$km = $meters/1000;
			$m = ceil($meters);
			if ($km == 1 and $displayUnits === 'kilometers') {
				$displayUnits = 'kilometer';
			}
			return  $meters % 100 == 0
				? "$km $displayUnits"
				: $m.$text['units']['meters'];
		}
	}
	
	/**
	 * Use this method to calculate the heading from pairs of coordinates
	 * @method heading
	 * @static
	 * @param {double} $lat1 latitude in degrees
	 * @param {double} $long1 longitude in degrees
	 * @param {double} $lat2 latitude in degrees
	 * @param {double} $long2 longitude in degrees
	 * @return {double} The heading, in degrees
	 */
	static function heading($lat1, $long1, $lat2, $long2) {
		$lat1 = $lat1 * M_PI / 180;
		$lat2 = $lat2 * M_PI / 180;
		$dLong = ($long2 - $long1) * M_PI / 180;
		$y = sin($dLong) * cos($lat2);
		$x = cos($lat1) * sin($lat2) - sin($lat1) * cos($lat2) * cos($dLong);
		$brng = atan2($y, $x);
		return ((($brng * 180 / M_PI) + 360) % 360);
	}
	
	/**
	 * Obtain a polyline from a route
	 * @method polyline
	 * @param {array} $route the route
	 * @param {string} $platform the platform which produced the route
	 * @return {array} An array of arrays of (x" => $latitude, "y" => $longitude)
	 */
	static function polyline($route, $options = array())
	{
		$platform = Q::ifset($options, 'platform', 'google');
		if ($platform !== 'google') {
			throw new Q_Exception_PlatformNotSupported(@compact('platform'));
		}
		$points = Places_Polyline::decode($route["overview_polyline"]["points"]);
		$polyline = array();
		for ($i = 0, $l = count($points); $i < $l; $i+=2) {
			$polyline[] = array(
				'x' => $points[$i],
				'y' => $points[$i+1]
			);
		}
		return $polyline;
	}
	
	/**
	 * Use this method to calculate the closest point on a polyline.
	 * @method closest
	 * @static
	 * @param {array} point
	 * @param {double} point.x
	 * @param {double} point.y 
	 * @param {array} polyline an array of associative arrays with "x" and "y" keys
	 * @return {array} contains properties "index", "x", "y", "fraction", "distance" (in same units as x, y)
	 */
	static function closest($point, $polyline) {
		$x = (float)$point['x'];
		$y = (float)$point['y'];
		$closest = null;
		$distance = null;
        for ($i=1, $l=count($polyline); $i<$l; $i++) {
			$a = $polyline[$i-1]['x'];
			$b = $polyline[$i-1]['y'];
			$c = $polyline[$i]['x'];
			$d = $polyline[$i]['y'];

			$n = ($c-$a)*($c-$a) + ($d-$b)*($d-$b);
			$frac = $n ? (($x-$a)*($c-$a) + ($y-$b)*($d-$b)) / $n : 0;
			$frac = max(0, min(1, $frac));
			$e = $a + ($c-$a)*$frac;
			$f = $b + ($d-$b)*$frac;
			$dist = sqrt(($x-$e)*($x-$e) + ($y-$f)*($y-$f));
			if ($distance === null || $distance > $dist) {
				$distance = $dist;
				$closest = array(
					'index' => $i,
					'x' => $e,
					'y' => $f,
					'distance' => $dist,
					'fraction' => $frac
				);
				if ($dist == 0) {
					break;
				}
			}
        }
		return $closest;
	}
	
	/**
	 * Call this function to quantize a (latitude, longitude) pair to grid of quantized
	 * (latitude, longitude) pairs which are spaced at most $meters apart.
	 * @method quantize
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $meters The radius, in meters, around this location.
	 *  Should be one of the array values in the Places/nearby/meters config.
	 * @return {Array} Returns an array of latitude and longitude quantized,
	 *  followed by the latitude and longitude grid spacing.
	 */
	static function quantize(
		$latitude, 
		$longitude, 
		$meters)
	{
		$latGrid = $meters / (1609.34 * 69.1703234283616);
		$latQuantized = floor($latitude / $latGrid + 0.00000001) * $latGrid;
		$longGrid = abs($latGrid / cos(deg2rad($latQuantized)));
		$longQuantized = floor($longitude / $longGrid + 0.00000001) * $longGrid;
		return array($latQuantized, $longQuantized, $latGrid, $longGrid);
	}
	
	/**
	 * A callback function used to sort the area filenames
	 * when displaying invitations for the "areas" batch
	 * @method sortAreaFilenames
	 * @param $filename1
	 * @param $filename2
	 */
	static function sortAreaFilenames($filename1, $filename2)
	{
		$parts = explode('-', $filename1);
		$parts = explode('_', $parts[count($parts)-2]);
		$l1 = $parts[count($parts)-2];
		$a1 = end($parts);
		$f1 = intval($a1);
		$c1 = substr($a1, strlen("$f1"));

		$parts = explode('-', $filename2);
		$parts = explode('_', $parts[count($parts)-2]);
		$l2 = $parts[count($parts)-2];
		$a2 = end($parts);
		$f2 = intval($a2);
		$c2 = substr($a2, strlen("$f2"));
		
		return ($l1 != $l2)
			? ($l1 > $l2 ? 1 : -1)
			: (($f1 != $f2) ? ($f1 > $f2 ? 1 : -1) : ($c1 != $c2 ? ($c1 > $c2 ? 1 : -1) : 0));
	}
	
	/**
	 * Set the user's location from a "Places/location" stream, or any stream
	 * that has the attributes "latitude", "longitude" and possibly "timezone"
	 * @method setUserLocation
	 * @param {Streams_Stream} $locationStream
	 * @param {boolean} [$onlyIfNotSet=false] If true, proceeds only if the user
	 *   location stream's latitude and longitude were not already set.
	 * @param {boolean} [$throwIfNotLoggedIn=false]
	 *   Whether to throw a Users_Exception_NotLoggedIn if no user is logged in.
	 * @return {boolean} Whether the location stream was updated
	 */
	static function setUserLocation(
		$locationStream,
		$onlyIfNotSet = false,
		$throwIfNotLoggedIn = false)
	{
		$meters = Q_Config::expect('Places', 'nearby', 'defaultMeters');
		$latitude = $locationStream->getAttribute('latitude');
		$longitude = $locationStream->getAttribute('longitude');
		$timezone = $locationStream->getAttribute('timezone');
		$postcodes = Places_Postcode::nearby($latitude, $longitude, $meters, 1);
		if ($postcodes) {
			$z = reset($postcodes);
			$postcode = $z->postcode;
			$placeName = $z->placeName;
			$state = $z->state;
		}
		$userLocationStream = Places_Location::userStream($throwIfNotLoggedIn);
		$lat = $userLocationStream->getAttribute('latitude');
		$lon = $userLocationStream->getAttribute('longitude');
		if ($onlyIfNotSet and isset($lat) and isset($lon)) {
			return false;
		}
		$userLocationStream->setAttribute(@compact(
			'latitude', 'longitude', 'meters', 'timezone',
			'postcode', 'placeName', 'state'
			// accuracy has been omitted
		));
		$userLocationStream->save();
		return true;
	}
	/**
	 * Get time zone related to latitude, longitude
	 * @method timezone
	 * @param {string} $latitude
	 * @param {string} $longitude
	 * @throws Exception
	 * @return {array} google response
	 */
	static function timezone($latitude, $longitude)
	{
		$key = Q_Config::expect('Places', 'google', 'keys', 'server');
		$location = "$latitude,$longitude";
		$timestamp = time();
		$sensor = 'false';
		$query = http_build_query(@compact('key', 'location', 'timestamp', 'sensor'));
		$url = "https://maps.googleapis.com/maps/api/timezone/json?$query";
		$json = self::getRemoteContents($url);
		$response = json_decode($json, true);

		if ($response['status'] != 'OK') {
			$errorMessage = "Error with request google timezone api: ";
			Q::log($errorMessage.$json, 'error');
			throw new Exception($errorMessage.$response['status']);
		}

		return $response;
	}
};