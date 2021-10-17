<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Category' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a category row in the Streams database.
 *
 * @class Streams_Category
 * @extends Base_Streams_Category
 */
class Streams_Category extends Base_Streams_Category
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
		// INSERT YOUR CODE HERE
		// e.g. $this->hasMany(...) and stuff like that.
	}
	
	/**
	 * Get the contents of the Streams_Category row, if any.
	 * @param {string} $publisherId
	 *  The publisher of the stream
	 * @param {string} $streamName
	 *  The name of the stream which is presumably related to/from other streams
	 * @return {array|null}
	 *  Returns the array(weight => array($publisherId, $streamName, $title, $icon))
	 */
	static function getRelatedTo($publisherId, $streamName, $relationType)
	{
		$row = Streams_Category::select()
			->where(@compact('publisherId', 'streamName'))
			->fetchDbRow();
		if (!$row) {
			return null;
		}
		$relatedTo = json_decode($row->relatedTo, true);
		if (!isset($relatedTo[$relationType])) {
			return null;
		}
		return $relatedTo[$relationType];
	}

	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Category} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Category();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};