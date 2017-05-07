<?php
	
class Places_Nearby
{
	/**
	 * Call this function to find the "nearby points" to publish to
	 * on a grid of quantized (latitude, longitude) pairs
	 * which are spaced at most $meters apart.
	 * @method forPublishers
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {array} [$metersArray=null] To override the default in "Places"/"nearby"/"meters" config
	 * @return {array} Returns an array of several ($streamName => $info) pairs
	 *  where the $streamName is the name of the stream corresponding to the "nearby point"
	 *  and $info includes the keys "latitude", "longitude", and "meters".
	 */
	static function forPublishers(
		$latitude, 
		$longitude,
		$metersArray = null)
	{
		$result = array();
		if (!isset($metersArray)) {
			$metersArray = Q_Config::expect('Places', 'nearby', 'meters');
		}
		foreach ($metersArray as $meters) {
			if ($longitude > 180) { $longitude = $longitude%180 - 180; }
			if ($longitude < -180) { $longitude = $longitude%180 + 180; }
			if ($latitude > 90) { $latitude = $latitude%90 - 90; }
			if ($latitude < -90) { $latitude = $latitude%90 + 90; }
			list($latQuantized, $longQuantized, $latGrid, $longGrid)
				= Places::quantize($latitude, $longitude, $meters);
			$streamName = Places_Nearby::streamName($latQuantized, $longQuantized, $meters);
			$result[$streamName] = array(
				'latitude' => $latQuantized,
				'longitude' => $longQuantized,
				'geohash' => Places_Geohash::encode($latQuantized, $longQuantized, 6),
				'meters' => $meters
			);
		}
		return $result;
	}
	
	/**
	 * Call this function to find the "nearby points" to subscribe to
	 * on a grid of quantized (latitude, longitude) pairs
	 * which are spaced at most $meters apart.
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $meters The radius, in meters, around this location.
	 *  Should be one of the array values in the Places/nearby/meters config.
	 * @return {Array} Returns an array of up to four ($streamName => $info) pairs
	 *  where the $streamName is the name of the stream corresponding to the "nearby point"
	 *  and $info includes the keys "latitude", "longitude", and "meters".
	 */
	static function forSubscribers(
		$latitude, 
		$longitude, 
		$meters)
	{
		list($latQuantized, $longQuantized, $latGrid, $a)
			= Places::quantize($latitude, $longitude, $meters);

		$metersArray = Q_Config::expect('Places', 'nearby', 'meters');
		if (!in_array($meters, $metersArray)) {
			throw new Q_Exception("The meters value needs to be in Places/nearby/meters config.");
		}
		
		$result = array();
		foreach (array($latQuantized, $latQuantized+$latGrid*1.1) as $lat) {
			list($a, $b, $c, $longGrid) = Places::quantize($lat, $longitude, $meters);
			foreach (array($longQuantized, $longQuantized+$longGrid*1.1) as $long) {
				list($latQ, $longQ) = Places::quantize($lat, $long, $meters);
				if ($longQ > 180) { $longQ = $longQ%180 - 180; }
				if ($longQ < -180) { $longQ = $longQ%180 + 180; }
				if ($latQ > 90) { $latQ = $latQ%90 - 90; }
				if ($latQ < -90) { $latQ = $latQ%90 + 90; }
				$streamName = self::streamName($latQ, $longQ, $meters);
				$result[$streamName] = array(
					'latitude' => $lat,
					'longitude' => $long,
					'geohash' => Places_Geohash::encode($latQ, $longQ, 6),
					'meters' => $meters
				);
			}
		}
		return $result;
	}
	
    /**
     * Get a range for looking things up by geohash.
	 * This would be more efficient in terms of lookup than the system of
	 * Places_Nearby::forPublishers and Places_Nearby::forSubscribers
	 * because it doesn't require multiple streams to function as rows
	 * of a "join table", one stream per mile range.
	 * However, the selection area gets more and more distorted at the poles,
	 * and may return more results than desired.
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {array} $meters The radius of meters to look around.
	 * @param {integer} [$length] Optional length of the resulting geohashes
	 * @return {Db_Range} for usage in various db queries to find geohashes inside a "square"
     */
	static function geohashRange($latitude, $longitude, $meters, $length = null)
	{
		$center = Places_Geohash::encode($latitude, $longitude, $length);
		$dlat = $meters / (1609.34 * 69.1703234283616);
		$dlong = $dlat / cos(deg2rad($latitude));
		$latNW = $latitude - $dlat;
		$longNW = $longitude - $dlong;
		if ($longNW > 180) { $longNW = $longNW%180 - 180; }
		if ($longNW < -180) { $longNW = $longNW%180 + 180; }
		if ($latNW > 90) { $latNW = $latNW%90 - 90; }
		if ($latNW < -90) { $latNW = $latNW%90 + 90; }
		$latSE = $latitude - $dlat;
		$longSE = $longitude - $dlong;
		if ($longSE > 180) { $longSE = $longSE%180 - 180; }
		if ($longSE < -180) { $longSE = $longSE%180 + 180; }
		if ($latSE > 90) { $latSE = $latSE%90 - 90; }
		if ($latSE < -90) { $latSE = $latSE%90 + 90; }
		$from = Places_Geohash::encode($latNW, $longNW, $length);
		$to = Places_Geohash::encode($latSE, $longSE, $length);
		return new Db_Range($from, true, true, $to);
	}
	
	/**
	 * Call this function to subscribe to streams on which messages are posted
	 * related to things happening the given number of $meters around the given location.
	 * @method subscribe
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to subscribe around
	 * @param {double} $longitude The longitude of the coordinates to subscribe around
	 * @param {double} $meters The radius, in meters, around this location.
	 *  Should be one of the array values in the Places/nearby/meters config.
	 * @param {string} $publisherId The id of the publisher publishing these streams.
	 *  Defaults to the app name in Q/app config.
	 * @param {array} [$options=array()]
	 *  The options to pass to the streams() and subscribe() functions
	 * @return {Array} Returns an array of up to four arrays of ($publisherId, $streamName)
	 *  of streams that were subscribed to.
	 */
	static function subscribe(
		$latitude, 
		$longitude, 
		$meters,
		$publisherId = null,
		$options = array())
	{
		$user = Users::loggedInUser(true);
		if (!isset($publisherId)) {
			$publisherId = Users::communityId();
		}
		$options['forSubscribers'] = true;
		$options['meters'] = $meters;
		$streams = Places_Nearby::streams($publisherId, $latitude, $longitude, $options);
		return Streams::subscribe($user->id, $publisherId, $streams, $options);
	}
	
	/**
	 * Call this function to unsubscribe from streams you previously subscribed to
	 * using Places_Nearby::subscribe.
	 * @method unsubscribe
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to subscribe around
	 * @param {double} $longitude The longitude of the coordinates to subscribe around
	 * @param {double} $meters The radius, in meters, around this location.
	 *  Should be one of the array values in the Places/nearby/meters config.
	 * @param {string} $publisherId The id of the publisher publishing these streams.
	 *  Defaults to the app name in Q/app config.
	 * @param {array} [$options=array()]
	 *  The options to pass to the streams() and unsubscribe() function
	 * @return {Array} Returns an array of up to four arrays of ($publisherId, $streamName)
	 *  of streams that were subscribed to.
	 */
	static function unsubscribe(
		$latitude, 
		$longitude, 
		$meters,
		$publisherId = null,
		$options = array())
	{
		$user = Users::loggedInUser(true);
		if (!isset($publisherId)) {
			$publisherId = Users::communityId();
		}
		$options['forSubscribers'] = true;
		$options['meters'] = $meters;
		$streams = Places_Nearby::streams($publisherId, $latitude, $longitude, $options);
		return Streams::unsubscribe($user->id, $publisherId, $streams, $options);
	}
	
	/**
	 * Obtain the name of a "Places/nearby" stream
	 * corresponding to the given parameters
	 * @method streamName
	 * @static
	 * @param {double} $latitude The latitude of the coordinates near which to relate
	 * @param {double} $longitude The longitude of the coordinates near which to relate
	 * @param {double} $meters The radius, in meters
	 */
	static function streamName($latitude, $longitude, $meters)
	{
		if ($before = Q::event('Places/streamName',
		compact('latitude', 'longitude', 'meters'), 'before')) {
			return $before;
		}
		$geohash = Places_Geohash::encode($latitude, $longitude, 6);
		return "Places/nearby/$geohash/$meters";
	}

	/**
	 * Fetch (and create, if necessary) "Places/nearby" streams
	 * corresponding ot the given parameters.
	 * @method streams
	 * @static
	 * @param {string} $publisherId The publisherId of the category streams
	 * @param {double} $latitude The latitude of the coordinates near which to relate
	 * @param {double} $longitude The longitude of the coordinates near which to relate
	 * @param {array} $options The options to pass to the Streams::relate and Streams::create functions. Also can contain the following options:
	 * @param {boolean} [$options.forSubscribers] Set to true to return the streams that are relevant to subscribers instead of publishers, i.e. users who want to know when something relevant happens, rather than users who want to relate the streams they publish to categories.
	 * @param {array|double} [$options.experience='main'] Override the name of the experience, the part of the stream name that's after "Streams/experience/"
	 * @param {array|double} [$options.meters] Override the default array of distances found in the config under Places/nearby/meters. If options.forSubscribers is true, however, this should be one of the entries from the array in Places/nearby/meters config.
	 * @param {callable} [$options.create] If set, this callback will be used to create streams when they don't already exist. It receives the $options array and should return a Streams_Stream object. If this option is set to null, new streams won't be created.
	 * @param {callable} [$options.transform="array_keys"] Can be used to override the function which takes the output of Places_Nearby::forPublishers, and this $options array, and returns the array of ($originalStreamName => $newStreamName) pairs.
	 * @param {array} [$streamNames=null] Optional reference to fill with the stream names
	 * @return {array|boolean} Returns the array of category streams
	 */
	static function streams(
		$publisherId,
		$latitude,
		$longitude,
		$options = array(),
		&$streamNames = null)
	{
		$meters = Q::ifset($options, 'meters', null);
		$nearby = empty($options['forSubscribers'])
			? Places_Nearby::forPublishers($latitude, $longitude, $meters)
			: Places_Nearby::forSubscribers($latitude, $longitude, $meters);
		if (!isset($fromPublisherId)) {
			$fromPublisherId = Users::communityId();
		}
		if ($transform = Q::ifset($options, 'transform', null)) {
			$transformed = call_user_func($transform, $nearby, $options);
			$create = Q::ifset($options, 'create', null);
		} else {
			$transformed = array_keys($nearby);
			$create = Q::ifset($options, 'create', array('Places_Nearby', '_create'));
		}
		$streams = Streams::fetch(null, $publisherId, $transformed);
		if (!isset($streamNames)) {
			$streamNames = array();
		}
		foreach ($nearby as $k => $info) {
			$name = isset($transformed[$k]) ? $transformed[$k] : $k;
			if (empty($streams[$name])) {
				if (empty($create)) {
					continue;
				}
				$params = compact(
					'publisherId', 'latitude', 'longitude',
					'fromPublisherId', 'fromStreamName',
					'transformed', 'meters',
					'nearby', 'name', 'info', 'streams'
				);
				$streams[$name] = call_user_func($create, $params, $options);
			}
			if (!in_array($name, $streamNames)) {
				$streamNames[] = $name;
			}
		}
		return $streams;
	}
	
	/**
	 * Fetch (and create, if necessary) stream on which messages are posted relating
	 * to things happening a given number of $meters around the given location.
	 * @method stream
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $meters The radius, in meters, around this location.
	 *  Should be one of the array values in the Places/nearby/meters config.
	 * @param {string} $publisherId The id of the publisher to publish this stream
	 *  Defaults to the app name in Q/app config.
	 * @param {string} $streamName The name of the stream to create.
	 *  Defaults to Places_Nearby::streamName($latitude, $longitude, $meters).
	 * @return {Streams_Stream} Returns the stream object that was created or fetched.
	 */
	static function stream(
		$latitude, 
		$longitude, 
		$meters,
		$publisherId = null,
		$streamName = null)
	{
		list($latitude, $longGrid)
			= Places::quantize($latitude, $longitude, $meters);
		$zipcodes = Places_Zipcode::nearby(
			$latitude, $longitude, $meters, 1
		);
		if (!isset($publisherId)) {
			$publisherId = Users::communityId();
		}
		if (!isset($streamName)) {
			$streamName = self::streamName($latitude, $longitude, $meters);
		}
		if ($stream = Streams::fetchOne(null, $publisherId, $streamName)) {
			return $stream;
		}
		$zipcode = $zipcodes ? reset($zipcodes) : null;
		$attributes = compact('latitude', 'longitude');
		if ($zipcode) {
			foreach (array('zipcode', 'placeName', 'state') as $attr) {
				$attributes[$attr] = $zipcode->$attr;
			}
		}
		$lat = sprintf("%0.1f", $latitude);
		$lng = sprintf("%0.1f", $longitude);
		$stream = Streams::create($publisherId, $publisherId, 'Places/nearby', array(
			'name' => $streamName,
			'title' => $zipcode
				? "Nearby {$zipcode->placeName} ({$zipcode->zipcode})"
				: "Nearby (lat$lat, lng$lng)",
			'attributes' => Q::json_encode($attributes)
		));
		return $stream;
	}
	
	static function _create($params, $options)
	{
		$info = $params['info'];
		return Places_Nearby::stream(
			$params['latitude'], $params['longitude'], $info['meters'],
			Q::ifset($info, 'publisherId', null),
			Q::ifset($info, 'name', null)
		);
	}
}