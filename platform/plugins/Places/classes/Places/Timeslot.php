<?php
	
class Places_Timeslot
{
	/**
	 * Fetch (and create, if necessary) category streams for things happening
	 * around the given location, during a particular hour.
	 * @method streams
	 * @static
	 * @param {string} $publisherId The publisherId of the category streams
	 * @param {double} $latitude The latitude of the coordinates near which to relate
	 * @param {double} $longitude The longitude of the coordinates near which to relate
	 * @param {double} $timestamp Timestamp the stream "takes place", used to determine the hour
	 * @param {string} $relationType The type of the relation to add
	 * @param {array} $options The options to pass to the Streams::relate and Streams::create functions. Also can contain the following options:
	 * @param {array} [$options.miles] Override the default set of distances found in the config under Places/nearby/miles
	 * @param {callable} [$options.create] If set, this callback will be used to create streams when they don't already exist. It receives the $options array and should return a Streams_Stream object. If this option is set to null, new streams won't be created.
	 * @param {callable} [$options.transform="array_keys"] Can be used to override the function which takes the output of Places_Nearby::forPublishers, and this $options array, and returns the array of ($originalStreamName => $newStreamName) pairs.
	 * @param {array} [$streamNames=null] Optional reference to fill with the stream names
	 * @return {array|boolean} Returns the array of category streams
	 */
	static function streams(
		$publisherId,
		$latitude, 
		$longitude, 
		$timestamp,
		$options = array(),
		&$streamNames = array())
	{
		$options = array_merge(array(
			'transform' => array('Places_Timeslot', '_transform'),
			'create' => array('Places_Timeslot', '_create'),
			'timestamp' => $timestamp
		), $options);
		return Places_Nearby::streams(
			$publisherId,
			$latitude,
			$longitude,
			$options,
			$streamNames
		);
	}
	
	static function _transform($nearby, $options)
	{
		$timestamp = $options['timestamp'];
		$timestamp = $timestamp - $timestamp % 3600;
		$experience = Q::ifset($options, 'experience', 'main');
		$result = array();
		foreach ($nearby as $k => $info) {
			$result[$k] = "Places/timeslot/$experience/$info[geohash]/$info[miles]/h/$timestamp";
		}
		return $result;
	}
	
	static function _create($params, $options)
	{
		$timestamp = $options['timestamp'];
		$timestamp = $timestamp - $timestamp % 3600;
		$info = $params['info'];
		$experience = Q::ifset($options, 'experience', 'main');
		$options['name'] = "Places/timeslot/$experience/$info[geohash]/$info[miles]/h/$timestamp";
		return Streams::create(null, $params['publisherId'], 'Places/timeslot', $options);
	}
}