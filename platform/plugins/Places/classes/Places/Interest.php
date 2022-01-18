<?php
	
class Places_Interest
{
	/**
	 * Fetch (and create, if necessary) category streams for things happening
	 * around the given location, during a particular hour.
	 * @method streams
	 * @static
	 * @param {string} $publisherId The publisherId of the category streams
	 * @param {double} $latitude The latitude of the coordinates near which to relate
	 * @param {double} $longitude The longitude of the coordinates near which to relate
	 * @param {string} $title The title of the interest, which will be normalized
	 * @param {array} $options The options to pass to the Streams::relate and Streams::create functions. Also can contain the following options:
	 * @param {string} [$experienceId="main"]
	 *   The id of a community experience, the last part of its stream name
	 * @param {array} [$options.meters] Override the default set of distances found in the config under Places/nearby/meters
	 * @param {callable} [$options.create] If set, this callback will be used to create streams when they don't already exist. It receives the $options array and should return a Streams_Stream object. If this option is set to null, new streams won't be created.
	 * @param {callable} [$options.transform="array_keys"] Can be used to override the function which takes the output of Places_Nearby::forPublishers, and this $options array, and returns the array of ($originalStreamName => $newStreamName) pairs.
	 * @param {array} [$streamNames=null] Optional reference to fill with the stream names
	 * @return {array} Returns the array of category streams
	 */
	static function streams(
		$publisherId,
		$latitude, 
		$longitude, 
		$title,
		$options = array(),
		&$streamNames = array())
	{
		$options = array_merge(array(
			'transform' => array('Places_Interest', '_transform'),
			'create' => array('Places_Interest', '_create'),
			'title' => $title
		), $options);
		return Places_Nearby::streams(
			$publisherId,
			$latitude,
			$longitude,
			$options,
			$streamNames
		);
	}
	
	/**
	 * Get all the relations to various Places/interest streams, sorted by ascending weight.
	 * Note that some of these streams may be slightly out of range
	 * and you may want to perform additional filtering using Places::distance().
	 * The "latitude", "longitude" and "meters" options can be used to override
	 * those found in Places_Nearby::defaults(). If after this, any one of
	 * "latitude", "longitude" or "meters" is still not set, then the
	 * "Streams/experience/$experienceId" stream is used instead of Places_Nearby streams.
	 * @method related
	 * @static
	 * @param {string} $publisherId The publisher of the category streams
	 * @param {string} $relationType The type of the relation
	 * @param {string|array|Db_Range} $titles
	 *    The titles of the interests, which will be normalized
	 * @param {string} [$experienceId="main"]
	 *    The id of a community experience, the last part of its stream name
	 * @return {array} Returns an array of Streams_RelatedTo objects
	 */
	static function related(
		$publisherId,
		$relationType,
		$titles,
		$experienceId = 'main')
	{
		if (is_string($titles)) {
			$titles = array($titles);
		}
		list($latitude, $longitude, $meters) = Places_Nearby::defaults();
		$categories = array('Places_Interest', '_categories');
		$options = @compact('categories', 'experienceId', 'titles');
		return Places_Nearby::related(
			$publisherId, $relationType, $latitude, $longitude, $meters, $options
		);
	}
	
	/**
	 * Get streams related to Places/interest streams, which are found from the
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
	 * @param {string|array|Db_Range} $titles 
	 *   The titles of the interests, which will be normalized
	 * @param {integer} $fromTime A unix timestamp, in either seconds or milliseconds
	 * @param {integer} $toTime A unix timestamp, in either seconds or milliseconds
	 * @param {string} [$experienceId="main"]
	 *   The id of a community experience, the last part of its stream name
	 * @param {array} [$options]
	 * @param {double} [$options.latitude] The latitude of the point to search around
	 * @param {double} [$options.longitude] The longitude of the point to search around
	 * @param {double} [$options.meters=null] One of the values in Places/nearby/meters config array,
	 *  used to find the right Places/nearby stream.
	 * @param {string} [$options.asUserId] Override the default user id to fetch streams as.
	 *  Not used for now, since this function always fetches the relations only.
	 * @return {array} Returns an array of Streams_RelatedTo objects
	 */
	static function byTime(
		$publisherId, 
		$relationType,
		$titles,
		$fromTime, 
		$toTime, 
		$experienceId = 'main',
		$options = array())
	{
		$fromTime = Q_Utils::timestamp($fromTime);
		$toTime = Q_Utils::timestamp($toTime);
		list($latitude, $longitude, $meters) = Places_Nearby::defaults();
		$weight = new Db_Range($fromTime, true, false, $toTime);
		if (is_string($titles)) {
			$titles = array($titles);
		}
		extract(Q::take($options, array('latitude', 'longitude', 'meters')), EXTR_IF_EXISTS);
		$categories = array('Places_Interest', '_categories');
		$o = @compact(
			'categories', 'experienceId', 'titles',
			'fromTime', 'toTime', 'weight'
		);
		if (isset($latitude) and isset($longitude) and isset($meters)) {
			return Places_Nearby::related(
				$publisherId, $relationType, $latitude, $longitude, $meters, $o
			);
		}
		$o['relationType'] = $relationType;
		$prefix = "Streams/interest/$experienceId/";
		if ($titles instanceof Db_Range) {
			$streamNames = new Db_Range(
				$prefix . $titles->min,
				$titles->includeMin,
				$titles->includeMax,
				$prefix . $titles->max
			);
		} else {
			$streamNames = array();
			foreach ($titles as $title) {
				$t[] = $prefix . Q_Utils::normalize($title);
			}
		}
		return Streams_RelatedTo::fetchAll(
			$publisherId, $streamNames, $relationType, $o
		);
	}
	
	static function _transform($nearby, $options)
	{
		$title = Q_Utils::normalize($options['title']);
		$experienceId = Q::ifset($options, 'experienceId', 'main');
		$result = array();
		foreach ($nearby as $k => $info) {
			$result[$k] = "Places/interest/$experienceId/$info[geohash]/$info[meters]/$title";
		}
		return $result;
	}
	
	static function _categories($nearby, $options)
	{
		$experienceId = Q::ifset($options, 'experienceId', 'main');
		$result = array();
		$titles = $options['titles'];
		foreach ($nearby as $k => $info) {
			$prefix = "Places/interest/$experienceId/$info[geohash]/$info[meters]/";
			if ($titles instanceof Db_Range) {
				$t = new Db_Range(
					$prefix . $titles->min,
					$titles->includeMin,
					$titles->includeMax,
					$prefix . $titles->max
				);
			} else {
				$t = array();
				foreach ($titles as $title) {
					$t[] = $prefix . Q_Utils::normalize($title);
				}
			}
			$result[$k] = $t;
		}
		return $result;
	}
	
	static function _create($params, $options)
	{
		$options['name'] = $params['name'];

		$stream = Streams_Stream::select()->where(array(
			"publisherId" => $params['publisherId'],
			"name" => $params['name']
		))->ignoreCache()->fetchDbRow();
		if ($stream) {
			return $stream;
		}

		return Streams::create(null, $params['publisherId'], 'Places/interest', $options);
	}
	
}