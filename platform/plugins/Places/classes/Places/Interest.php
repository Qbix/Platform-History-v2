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