<?php
	
class Places_Nearby
{
	/**
	 * Call this function to find the "nearby points" to publish to
	 * on a grid of quantized (latitude, longitude) pairs
	 * which are spaced at most $miles apart.
	 * @method forPublishers
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {array} [$milesArray=null] To override the default in "Places"/"nearby"/"miles" config
	 * @return {array} Returns an array of several ($streamName => $info) pairs
	 *  where the $streamName is the name of the stream corresponding to the "nearby point"
	 *  and $info includes the keys "latitude", "longitude", and "miles".
	 */
	static function forPublishers(
		$latitude, 
		$longitude,
		$milesArray = null)
	{
		$result = array();
		if (!isset($milesArray)) {
			$milesArray = Q_Config::expect('Places', 'nearby', 'miles');
		}
		foreach ($milesArray as $miles) {
			if ($longitude > 180) { $longitude = $longitude%180 - 180; }
			if ($longitude < -180) { $longitude = $longitude%180 + 180; }
			if ($latitude > 90) { $latitude = $latitude%90 - 90; }
			if ($latitude < -90) { $latitude = $latitude%90 + 90; }
			list($latQuantized, $longQuantized, $latGrid, $longGrid)
				= Places::quantize($latitude, $longitude, $miles);
			$streamName = Places_Nearby::streamName($latQuantized, $longQuantized, $miles);
			$result[$streamName] = array(
				'latitude' => $latQuantized,
				'longitude' => $longQuantized,
				'geohash' => Places_Geohash::encode($latQuantized, $longQuantized, 6),
				'miles' => $miles
			);
		}
		return $result;
	}
	
	/**
	 * Call this function to find the "nearby points" to subscribe to
	 * on a grid of quantized (latitude, longitude) pairs
	 * which are spaced at most $miles apart.
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $miles The radius, in miles, around this location.
	 *  Should be one of the array values in the Places/nearby/miles config.
	 * @return {Array} Returns an array of up to four ($streamName => $info) pairs
	 *  where the $streamName is the name of the stream corresponding to the "nearby point"
	 *  and $info includes the keys "latitude", "longitude", and "miles".
	 */
	static function forSubscribers(
		$latitude, 
		$longitude, 
		$miles)
	{
		list($latQuantized, $longQuantized, $latGrid, $a)
			= Places::quantize($latitude, $longitude, $miles);

		$milesArray = Q_Config::expect('Places', 'nearby', 'miles');
		if (!in_array($miles, $milesArray)) {
			throw new Q_Exception("The miles value needs to be in Places/nearby/miles config.");
		}
		
		$result = array();
		foreach (array($latQuantized, $latQuantized+$latGrid*1.1) as $lat) {
			list($a, $b, $c, $longGrid) = Places::quantize($lat, $longitude, $miles);
			foreach (array($longQuantized, $longQuantized+$longGrid*1.1) as $long) {
				list($latQ, $longQ) = Places::quantize($lat, $long, $miles);
				if ($longQ > 180) { $longQ = $long%180 - 180; }
				if ($longQ < -180) { $longQ = $long%180 + 180; }
				if ($latQ > 90) { $latQ = $latQ%90 - 90; }
				if ($latQ < -90) { $latQ = $latQ%90 + 90; }
				$streamName = self::streamName($latQ, $longQ, $miles);
				$result[$streamName] = array(
					'latitude' => $lat,
					'longitude' => $long,
					'geohash' => Places_Geohash::encode($latQ, $longQ, 6),
					'miles' => $miles
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
	 * @param {array} $miles The radius of miles to look around.
	 * @return {Db_Range}
     */
	static function geohashRange($latitude, $longitude, $miles)
	{
		// TODO: implement
	}
	
	/**
	 * Call this function to subscribe to streams on which messages are posted
	 * related to things happening the given number of $miles around the given location.
	 * @method subscribe
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to subscribe around
	 * @param {double} $longitude The longitude of the coordinates to subscribe around
	 * @param {double} $miles The radius, in miles, around this location.
	 *  Should be one of the array values in the Places/nearby/miles config.
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
		$miles,
		$publisherId = null,
		$options = array())
	{
		$user = Users::loggedInUser(true);
		if (!isset($publisherId)) {
			$publisherId = Users::communityId();
		}
		$options['forSubscribers'] = true;
		$options['miles'] = $miles;
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
	 * @param {double} $miles The radius, in miles, around this location.
	 *  Should be one of the array values in the Places/nearby/miles config.
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
		$miles,
		$publisherId = null,
		$options = array())
	{
		$user = Users::loggedInUser(true);
		if (!isset($publisherId)) {
			$publisherId = Users::communityId();
		}
		$options['forSubscribers'] = true;
		$options['miles'] = $miles;
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
	 * @param {double} $miles The radius, in miles
	 */
	static function streamName($latitude, $longitude, $miles)
	{
		if ($before = Q::event('Places/streamName',
		compact('latitude', 'longitude', 'miles'), 'before')) {
			return $before;
		}
		$geohash = Places_Geohash::encode($latitude, $longitude, 6);
		return "Places/nearby/$geohash/$miles";
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
	 * @param {array|double} [$options.miles] Override the default array of distances found in the config under Places/nearby/miles. If options.forSubscribers is true, however, this should be one of the entries from the array in Places/nearby/miles config.
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
		$miles = Q::ifset($options, 'miles', null);
		$nearby = empty($options['forSubscribers'])
			? Places_Nearby::forPublishers($latitude, $longitude, $miles)
			: Places_Nearby::forSubscribers($latitude, $longitude, $miles);
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
					'transformed', 'miles',
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
	 * to things happening a given number of $miles around the given location.
	 * @method stream
	 * @static
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $miles The radius, in miles, around this location.
	 *  Should be one of the array values in the Places/nearby/miles config.
	 * @param {string} $publisherId The id of the publisher to publish this stream
	 *  Defaults to the app name in Q/app config.
	 * @param {string} $streamName The name of the stream to create.
	 *  Defaults to Places_Nearby::streamName($latitude, $longitude, $miles).
	 * @return {Streams_Stream} Returns the stream object that was created or fetched.
	 */
	static function stream(
		$latitude, 
		$longitude, 
		$miles,
		$publisherId = null,
		$streamName = null)
	{
		list($latitude, $longGrid)
			= Places::quantize($latitude, $longitude, $miles);
		$zipcodes = Places_Zipcode::nearby(
			$latitude, $longitude, $miles, 1
		);
		if (!isset($publisherId)) {
			$publisherId = Users::communityId();
		}
		if (!isset($streamName)) {
			$streamName = self::streamName($latitude, $longitude, $miles);
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
		$stream = Streams::create($publisherId, $publisherId, 'Places/nearby', array(
			'name' => $streamName,
			'title' => $zipcode
				? "Nearby ($latitude, $longitude): {$zipcode->placeName}, zipcode {$zipcode->zipcode}"
				: "Nearby ($latitude, $longitude)",
			'attributes' => Q::json_encode($attributes)
		));
		return $stream;
	}
	
	static function _create($params, $options)
	{
		$info = $params['info'];
		return Places_Nearby::stream(
			$info['latitude'], $info['longitude'], $info['miles'],
			Q::ifset($info, 'publisherId', null),
			Q::ifset($info, 'name', null)
		);
	}
}