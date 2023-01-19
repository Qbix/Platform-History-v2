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
	 * @param {array} [$metersArray=null] To override the default in "Places"/"nearby"/"meters" config. Useful for only notifying people within a certain radius.
	 * @param {string} [$experienceId='main'] The id of the experience stream, the part that comes after "Streams/experience/"
	 * @return {array} Returns an array of several ($streamName => $info) pairs
	 *  where the $streamName is the name of the stream corresponding to the "nearby point"
	 *  and $info includes the keys "latitude", "longitude", and "meters".
	 */
	static function forPublishers(
		$latitude, 
		$longitude,
		$metersArray = null,
		$experienceId = 'main')
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
			$streamName = Places_Nearby::streamName(
				$latQuantized, $longQuantized, $meters, $experienceId
			);
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
	 * @param {string} [$experienceId='main'] The id of the experience stream,
	 *  the part that comes after "Streams/experience/"
	 * @return {Array} Returns an array of up to four ($streamName => $info) pairs
	 *  where the $streamName is the name of the stream corresponding to the "nearby point"
	 *  and $info includes the keys "latitude", "longitude", and "meters".
	 */
	static function forSubscribers(
		$latitude, 
		$longitude, 
		$meters,
		$experienceId = 'main')
	{
		list($latQuantized, $longQuantized, $latGrid, $a)
			= Places::quantize($latitude, $longitude, $meters);

		$metersArray = Q_Config::expect('Places', 'nearby', 'meters');
		if (!in_array($meters, $metersArray)) {
			throw new Q_Exception("The $meters meters value needs to be in Places/nearby/meters config.");
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
				$streamName = self::streamName($latQ, $longQ, $meters, $experienceId);
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
	 * @param {string} $publisherId The id of the publisher publishing these streams.
	 * @param {double} $latitude The latitude of the coordinates to subscribe around
	 * @param {double} $longitude The longitude of the coordinates to subscribe around
	 * @param {double} $meters The radius, in meters, around this location.
	 *  Should be one of the array values in the Places/nearby/meters config.
	 * @param {array} [$options=array()]
	 *  The options to pass to the streams() and subscribe() functions
	 * @return {Array} Returns an array of up to four arrays of ($publisherId, $streamName)
	 *  of streams that were subscribed to.
	 */
	static function subscribe(
		$publisherId = null,
		$latitude, 
		$longitude, 
		$meters,
		$options = array())
	{
		$user = Users::loggedInUser(true);
		$options['forSubscribers'] = true;
		$options['meters'] = $meters;
		$streams = Places_Nearby::streams($publisherId, $latitude, $longitude, $options);
		return Streams::subscribe($user->id, $publisherId, $streams, $options);
	}
	/**
	 * Call this function to join to streams on which messages are posted
	 * related to things happening the given number of $meters around the given location.
	 * @method join
	 * @static
	 * @param {string} $publisherId The id of the publisher publishing these streams.
	 * @param {double} $latitude The latitude of the coordinates to subscribe around
	 * @param {double} $longitude The longitude of the coordinates to subscribe around
	 * @param {double} $meters The radius, in meters, around this location.
	 *  Should be one of the array values in the Places/nearby/meters config.
	 * @param {array} [$options=array()]
	 *  The options to pass to the streams() and subscribe() functions
	 * @return {Array} Returns an array of up to four arrays of ($publisherId, $streamName)
	 *  of streams that were subscribed to.
	 */
	static function join(
		$publisherId,
		$latitude,
		$longitude,
		$meters,
		$options = array())
	{
		$user = Users::loggedInUser(true);
		$options['forSubscribers'] = true;
		$options['meters'] = $meters;
		$streams = Places_Nearby::streams($publisherId, $latitude, $longitude, $options);
		return Streams::join($user->id, $publisherId, $streams, $options);
	}

	/**
	 * Call this function to unsubscribe from streams you previously subscribed to
	 * using Places_Nearby::subscribe.
	 * @method unsubscribe
	 * @static
	 * @param {string} $publisherId The id of the publisher publishing these streams.
	 * @param {double} $latitude The latitude of the coordinates to subscribe around
	 * @param {double} $longitude The longitude of the coordinates to subscribe around
	 * @param {double} $meters The radius, in meters, around this location.
	 *  Should be one of the array values in the Places/nearby/meters config.
	 * @param {array} [$options=array()]
	 *  The options to pass to the streams() and unsubscribe() function
	 * @return {Array} Returns an array of up to four arrays of ($publisherId, $streamName)
	 *  of streams that were subscribed to.
	 */
	static function unsubscribe(
		$publisherId,
		$latitude, 
		$longitude, 
		$meters,
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
	 * @param {string} [$experienceId='main'] Override the id of the experience, the part of the stream name that's after "Streams/experience/"
	 * @return {string}
	 */
	static function streamName($latitude, $longitude, $meters, $experienceId = 'main')
	{
		if ($before = Q::event('Places/streamName',
		@compact('latitude', 'longitude', 'meters'), 'before')) {
			return $before;
		}
		$geohash = Places_Geohash::encode($latitude, $longitude, 6);
		return "Places/nearby/$experienceId/$geohash/$meters";
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
	 * @param {string} [$options.experienceId='main'] Override the id of the experience, the part of the stream name that's after "Streams/experience/"
	 * @param {array|double} [$options.meters] Override the default array of distances found in the config under Places/nearby/meters. If options.forSubscribers is true, however, this should be one of the entries from the array in Places/nearby/meters config.
	 * @param {callable} [$options.create] If set, this callback will be used to create streams when they don't already exist. It receives the $options array and should return a Streams_Stream object. If this option is set to null, new streams won't be created.
	 * @param {callable} [$options.transform="array_keys"] Can be used to override the function which takes the output of Places_Nearby::forPublishers, and this $options array, and returns the array of ($originalStreamName => $newStreamName) pairs.
	 * @param {array} [$streamNames=null] Optional reference to fill with the stream names
	 * @return {array} Returns the array of category streams
	 */
	static function streams(
		$publisherId,
		$latitude,
		$longitude,
		$options = array(),
		&$streamNames = null)
	{
		$meters = Q::ifset($options, 'meters', null);
		$experienceId = Q::ifset($options, 'experienceId', 'main');
		$nearby = empty($options['forSubscribers'])
			? Places_Nearby::forPublishers($latitude, $longitude, $meters, $experienceId)
			: Places_Nearby::forSubscribers($latitude, $longitude, $meters, $experienceId);
		if (!isset($fromPublisherId)) {
			$fromPublisherId = Users::communityId();
		}
		if (isset($options['transform'])) {
			$transformed = call_user_func($options['transform'], $nearby, $options);
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
				$params = @compact(
					'publisherId', 'latitude', 'longitude',
					'fromPublisherId', 'fromStreamName',
					'transformed', 'meters',
					'nearby', 'name', 'info', 'streams'
				);
				$options['name'] = $name;
				$options['skipAccess'] = true;
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
	 * @param {string} $publisherId The id of the publisher to publish this stream
	 * @param {double} $latitude The latitude of the coordinates to search around
	 * @param {double} $longitude The longitude of the coordinates to search around
	 * @param {double} $meters The radius, in meters, around this location.
	 *  Should be one of the array values in the Places/nearby/meters config.
	 * @param {string} $streamName The name of the stream to create.
	 *  Defaults to Places_Nearby::streamName($latitude, $longitude, $meters, $experienceId).
	 * @param {string} [$experienceId='main'] The id of the experience stream,
	 *  the part that comes after "Streams/experience/"
	 * @param {array} [$options=array()] Options for Q_Text::get()
	 * @return {Streams_Stream} Returns the stream object that was created or fetched.
	 */
	static function stream(
		$publisherId,
		$latitude, 
		$longitude, 
		$meters,
		$streamName = null,
		$experienceId = 'main',
		$options = array())
	{
		list($latQuantized, $longQuantized)
			= Places::quantize($latitude, $longitude, $meters);
		$postcodes = Places_Postcode::nearby(
			$latitude, $longitude, $meters, 1
		);
		if (!isset($streamName)) {
			$streamName = self::streamName(
				$latQuantized, $longQuantized, $meters, $experienceId
			);
		}
		if ($stream = Streams_Stream::fetch(null, $publisherId, $streamName)) {
			return $stream;
		}
		$postcode = $postcodes ? reset($postcodes) : null;
		$attributes = @compact('latitude', 'longitude', 'meters');
		if ($postcode) {
			foreach (array('postcode', 'placeName', 'state') as $attr) {
				$attributes[$attr] = $postcode->$attr;
			}
		}
		$lat = sprintf("%0.1f", $latitude);
		$lng = sprintf("%0.1f", $longitude);
		$content = Q_Text::get('Places/content', $options);
		$placeName = Q::ifSet($postcode, "placeName", null);
		$postCode = Q::ifSet($postcode, "postcode", null);
		$postcodeLabel = Q::interpolate(
			$content['nearby']['PostcodeLabel'], array($placeName, $postCode)
		);
		$latLng = Q::interpolate($content['LatLng'], array($lat, $lng));
		$title = Q::interpolate(
			$content['nearby']['Title'],
			array(Places::distanceLabel($meters), $postcode ? $postcodeLabel : $latLng)
		);
		$stream = Streams::create($publisherId, $publisherId, 'Places/nearby', array(
			'name' => $streamName,
			'title' => $title,
			'attributes' => Q::json_encode($attributes),
			'skipAccess' => true
		));
		return $stream;
	}
	
	/**
	 * Get the default latitude, longitude and meters to search around
	 * @method defaults
	 * @param {double} $meters Can override it to be one of the values in
	 *  Places/nearby/meters config array
	 * @return {array} An array containing $latitude, $longitude, $meters
	 */
	static function defaults($meters = null) {
		if ($uls = Places_Location::userStream()) {
			$latitude = $uls->getAttribute('latitude', null);
			$longitude = $uls->getAttribute('longitude', null);
			$m = $uls->getAttribute('meters', null);
		} else {
			$latitude = Q_Config::expect('Places', 'location', 'default', 'latitude');
			$longitude = Q_Config::expect('Places', 'location', 'default', 'longitude');
		}
		if (isset($meters)) {
			$m = $meters;
		} else if (!isset($m)) {
			$metersArray = Q_Config::expect('Places', 'nearby', 'meters');
			$m = $metersArray[floor(count($metersArray)/2)];
		}
		return array($latitude, $longitude, $m);
	}
	
	/**
	 * Get all the relations to various Places/nearby (or similar type category)
	 * streams, sorted by ascending weight.
	 * Note that some of these streams may be slightly out of range
	 * and you may want to perform additional filtering using Places::distance().
	 * @method related.
	 * @static
	 * @param {string} $publisherId The publisher of the category streams
	 * @param {string} $relationType The type of the relation to the category streams
	 * @param {double} $latitude The latitude of the point to search around
	 * @param {double} $longitude The longitude of the point to search around
	 * @param {double} $meters The radius to search within
	 * @param {array} $options The options to pass to the Streams_RelatedTo::fetchAll function.
	 *  Also can contain the following options:
	 * @param {callable} [$options.categories="array_keys"] Can be used to override the function
	 *   which takes the output of Places_Nearby::forSubscribers, and this $options array,
	 *   and returns the array of ($originalStreamName => $criteria) pairs.
	 *   The $criteria can be a string or array or Db_Range or Db_Expression.
	 * @return {array} An array of Streams_RelatedTo objects, sorted by ascending weight.
	 */
	static function related(
		$publisherId, 
		$relationType,
		$latitude,
		$longitude,
		$meters,
		$options = array())
	{
		$nearby = Places_Nearby::forSubscribers($latitude, $longitude, $meters);
		if (isset($options['categories'])) {
			$streamNames = call_user_func($options['categories'], $nearby, $options);
		} else {
			$streamNames = array_keys($nearby);
		}
		return Streams_RelatedTo::fetchAll($publisherId, $streamNames, $relationType, $options);
	}
	
	/**
	 * Get streams related to Places/nearby streams, which are found from the
	 * following parameters. Note that some of these streams may be slightly out of range
	 * and you may want to perform additional filtering using Places::distance().
	 * The "latitude", "longitude" and "meters" options can be used to override
	 * those found in Places_Nearby::defaults(). If after this, any one of
	 * "latitude", "longitude" or "meters" is still not set, then the
	 * "Streams/experience/$experienceId" stream is used instead of Places_Nearby streams.
	 * @method byTime
	 * @static
	 * @param {string} $publisherId The publisher of the category streams
	 * @param {string} $relationType The type of the relation
	 * @param {integer} $fromTime A unix timestamp, in either seconds or milliseconds
	 * @param {integer} $toTime A unix timestamp, in either seconds or milliseconds
	 * @param {string} [$streamName="Streams/experience/main"] The stream name of a community experience
	 * @param {array} [$options] Options to pass to Places_Nearby::related(). Also can contain:
	 * @param {double} [$options.latitude] The latitude of the point to search around
	 * @param {double} [$options.longitude] The longitude of the point to search around
	 * @param {double} [$options.meters] The radius to search within
	 * @param {double} [$meters=null] One of the values in Places/nearby/meters config array,
	 *  used to find the right Places/nearby stream.
	 * @return {array} Returns an array of Streams_RelatedTo objects
	 */
	static function byTime(
		$publisherId, 
		$relationType,
		$fromTime, 
		$toTime, 
		$streamName = "Streams/experience/main",
		$options = array())
	{
		$fromTime = Q_Utils::timestamp($fromTime);
		$toTime = Q_Utils::timestamp($toTime);
		$weight = new Db_Range($fromTime, true, false, $toTime);
		list($latitude, $longitude, $meters) = Places_Nearby::defaults();
		extract(Q::take($options, array('latitude', 'longitude', 'meters')), EXTR_IF_EXISTS);
		if (!isset($latitude) or !isset($longitude) or !isset($meters)) {
			$o = @compact('weight');
			return Streams_RelatedTo::fetchAll(
				$publisherId, array($streamName), $relationType, $o
			);
		}
		$categories = array('Places_Nearby', '_categories');
		$options = @compact('categories', 'experienceId', 'fromTime', 'toTime', 'weight');
		return Places_Nearby::related(
			$publisherId, $relationType, $latitude, $longitude, $meters, $options
		);
	}
	
	static function _categories($nearby, $options)
	{
		$experienceId = Q::ifset($options, 'experienceId', 'main');
		$result = array();
		foreach ($nearby as $k => $info) {
			$result[$k] = "Places/nearby/$experienceId/$info[geohash]/$info[meters]";
		}
		return $result;
	}
	
	static function _create($params, $options)
	{
		$info = $params['info'];
		return Places_Nearby::stream(
			$params['publisherId'],
			$info['latitude'], $info['longitude'], $info['meters'],
			Q::ifset($info, 'name', null),
			Q::ifset($options, 'experienceId', 'main')
		);
	}
}