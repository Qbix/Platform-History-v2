<?php
	
class Places_Timeslot
{
	/**
	 * Call this function to relate a stream to category streams for things happening
	 * around the given location, during a particular hour.
	 * @method relateTo
	 * @static
	 * @param {string} $publisherId The publisherId of the category streams
	 * @param {double} $latitude The latitude of the coordinates near which to relate
	 * @param {double} $longitude The longitude of the coordinates near which to relate
	 * @param {double} $timestamp Timestamp the stream "takes place", used to determine the hour
	 * @param {string} $fromPublisherId The publisherId of the stream to relate
	 * @param {string} $fromStreamName The name of the stream to relate
	 * @param {string} $relationType The type of the relation to add
	 * @param {array} $options The options to pass to the Streams::relate and Streams::create functions. Also can contain the following options:
	 * @param {array} [$options.miles] Override the default set of distances found in the config under Places/nearby/miles
	 * @return {array|boolean} Returns the array of category streams
	 */
	static function relateTo(
		$publisherId,
		$latitude, 
		$longitude, 
		$timestamp,
		$fromPublisherId,
		$fromStreamName,
		$options = array())
	{
		$options = array_merge(array(
			'transform' => array('Places_Timeslot', '_transform'),
			'create' => array('Places_Timeslot', '_create'),
			'timestamp' => $timestamp
		), $options);
		Places_Nearby::relateTo(
			$publisherId,
			$latitude,
			$longitude,
			$fromPublisherId,
			$fromStreamName,
			Q::ifset($options, 'relationType', 'Places/timeslot'),
			$options
		);
	}
	
	static function _transform($nearby, $options)
	{
		$timestamp = $options['timestamp'];
		$timestamp = $timestamp - $timestamp % 3600;
		$result = array();
		foreach ($nearby as $k => $info) {
			$result[$k] = "Places/timeslot/$info[geohash]/$info[miles]/h/$timestamp";
		}
		return $result;
	}
	
	static function _create($params, $options)
	{
		$timestamp = $options['timestamp'];
		$timestamp = $timestamp - $timestamp % 3600;
		$info = $params['info'];
		$options['name'] = "Places/timeslot/$info[geohash]/$info[miles]/h/$timestamp";
		return Streams::create(null, $params['publisherId'], 'Places/timeslot', $options);
	}
}