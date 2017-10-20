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
	 * Get streams related to Places/interest streams, which are found from the
	 * following parameters.
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
		$options = compact('categories', 'experienceId', 'titles');
		return Places_Nearby::related(
			$publisherId, $relationType, $latitude, $longitude, $meters, $options
		);
	}
	
	/**
	 * Get streams related to Places/nearby streams, which are found from the
	 * following parameters.
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
	 * @param {double} [$options.meters] The radius to search within
	 * @param {double} [$meters=null] One of the values in Places/nearby/meters config array,
	 *  used to find the right Places/nearby stream.
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
		if (is_string($titles)) {
			$titles = array($titles);
		}
		$fromTime = Q_Utils::timestamp($fromTime);
		$toTime = Q_Utils::timestamp($toTime);
		list($latitude, $longitude, $meters) = Places_Nearby::defaults();
		extract(Q::take($options, array('latitude', 'longitude', 'meters')), EXTR_IF_EXISTS);
		$categories = array('Places_Interest', '_categories');
		$weight = new Db_Range($fromTime, true, false, $toTime);
		$options = compact(
			'categories', 'experienceId', 'titles',
			'fromTime', 'toTime', 'weight'
		);
		return Places_Nearby::related(
			$publisherId, $relationType, $latitude, $longitude, $meters, $options
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
			if ($titles instanceof Db_Range) {
				$prefix = "Places/interest/$experienceId/$info[geohash]/$info[meters]/";
				$t = new Db_Range(
					$prefix . $options['titles']->min,
					$titles->includeMin,
					$titles->includeMax,
					$prefix . $titles->max
				);
			} else {
				$t = array();
				foreach ($titles as $title) {
					$title = Q_Utils::normalize($title);
					$t[] = "Places/interest/$experienceId/$info[geohash]/$info[meters]/$title";
				}
			}
			$result[$k] = $t;
		}
		return $result;
	}
	
	static function _create($params, $options)
	{
		$options['name'] = $params['name'];
		return Streams::create(null, $params['publisherId'], 'Places/interest', $options);
	}
	
}