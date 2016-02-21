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
 	 * @param {double} [$miles=25] Override the radius, in miles, to search around
	 * @return {Streams_Stream|null}
	 * @throws {Q_Exception} if a bad value is encountered and $throwIfBadValue is true
	 */
	static function autocomplete(
		$input, 
		$throwIfBadValue = false,
		$types = null, 
		$latitude = null, 
		$longitude = null,
		$miles = 25)
	{
		$supportedTypes = array("establishment", "locality", "sublocality", "postal_code", "country", "administrative_area_level_1", "administrative_area_level_2");
		$input = strtolower($input);
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
				if (!isset($miles)) {
					$miles = $uls->getAttribute('miles', 25);
				}
			} else {
				// put some defaults
				$latitude = 40.5806032;
				$longitude = -73.9755244;
				$miles = 25;
			}
		}

		$pa = null;
		if (Q_Config::get('Places', 'cache', 'autocomplete', true)) {
			$pa = new Places_Autocomplete();
			$pa->query = $input;
			$pa->types = $types ? implode(',', $types) : '';
			$pa->latitude = $latitude;
			$pa->longitude = $longitude;
			$pa->miles = $miles;
			if ($pa->retrieve()) {
				$ut = $pa->updatedTime;
				if (isset($ut)) {
					$db = $pa->db();
					$ut = $db->fromDateTime($ut);
					$ct = $db->getCurrentTimestamp();
					$cd = Q_Config::get('Places', 'cache', 'duration', 60*60*24*30);
					if ($ct - $ut < $cd) {
						// there are cached autocomplete results that are still viable
						return json_decode($pa->results, true);
					}
				}
			}
		}

		$key = Q_Config::expect('Places', 'google', 'keys', 'server');
		$location = "$latitude,$longitude";
		$radius = ceil(1609.34 * $miles);
		if ($types === null) {
			unset($types);
		}
		$query = http_build_query(compact('key', 'input', 'types', 'location', 'radius'));
		$url = "https://maps.googleapis.com/maps/api/place/autocomplete/json?$query";
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$json = curl_exec($ch);
		curl_close($ch);
		$response = json_decode($json, true);
		if (empty($response['predictions'])) {
			throw new Q_Exception("Places::autocomplete: Couldn't obtain predictions for $input");
		}
		if (!empty($response['error_message'])) {
			throw new Q_Exception("Places::autocomplete: ".$response['error_message']);
		}
		$results = $response['predictions'];
		if ($pa) {
			$pa->results = json_encode($results);
			$pa->save();
		}
		return $results;
	}
	
	/**
	 * Use this to calculate the haversine distance between two sets of lat/long coordinates on the Earth
	 * @method distance
	 * @static
	 * @param {double} $lat_1
	 * @param {double} $long_1
	 * @param {double} $lat_2
	 * @param {double} $long_2
	 * @return {double} The result, in miles, of applying the haversine formula
	 */
	static function distance($lat_1,$long_1,$lat_2,$long_2)
	{
		$earth_radius = 3963.1676; // in miles

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
	 * Call this function to quantize a (latitude, longitude) pair to grid of quantized
	 * (latitude, longitude) pairs which are spaced at most $miles apart.
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $miles The radius, in miles, around this location.
	 *  Should be one of the array values in the Places/nearby/miles config.
	 * @return {Array} Returns an array of latitude and longitude quantized,
	 *  followed by the latitude and longitude grid spacing.
	 */
	static function quantize(
		$latitude, 
		$longitude, 
		$miles)
	{
		$latGrid = $miles / 69.1703234283616;
		$latQuantized = floor($latitude / $latGrid) * $latGrid;
		$longGrid = abs($latGrid / cos(deg2rad($latQuantized)));
		$longQuantized = floor($longitude / $longGrid) * $longGrid;
		return array($latQuantized, $longQuantized, $latGrid, $longGrid);
	}
};