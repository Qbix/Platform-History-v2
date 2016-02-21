<?php
	
class Places_Interest
{
	/**
	 * Call this function to relate a stream to category streams for things happening
	 * around the given location, about a certain interest.
	 * @method relateTo
	 * @static
	 * @param {string} $publisherId The publisherId of the category streams
	 * @param {double} $latitude The latitude of the coordinates near which to relate
	 * @param {double} $longitude The longitude of the coordinates near which to relate
	 * @param {double} $title The title of the interest, which will be normalized
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
		$title,
		$fromPublisherId,
		$fromStreamName,
		$options = array())
	{
		$options = array_merge(array(
			'transform' => array('Places_Interest', '_transform'),
			'create' => array('Places_Interest', '_create'),
			'title' => $title
		), $options);
		Places_Nearby::relateTo(
			$publisherId,
			$latitude,
			$longitude,
			$fromPublisherId,
			$fromStreamName,
			Q::ifset($options, 'relationType', 'Places/interest'),
			$options
		);
	}
	
	static function _transform($nearby, $options)
	{
		$title = Q_Utils::normalize($options['title']);
		$result = array();
		foreach ($nearby as $k => $info) {
			$result[$k] = "Places/interest/$info[geohash]/$info[miles]/$title";
		}
		return $result;
	}
	
	static function _create($params, $options)
	{
		$title = Q_Utils::normalize($options['title']);
		$info = $params['info'];
		$options['name'] = "Places/interest/$info[geohash]/$info[miles]/$title";
		return Streams::create(null, $params['publisherId'], 'Places/interest', $options);
	}
	
}