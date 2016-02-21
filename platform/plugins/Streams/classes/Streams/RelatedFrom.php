<?php
/**
 * @module Streams
 */
/**
 * Class representing 'RelatedFrom' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a related_from row in the Streams database.
 *
 * @class Streams_RelatedFrom
 * @extends Base_Streams_RelatedFrom
 */
class Streams_RelatedFrom extends Base_Streams_RelatedFrom
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
	}

	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_RelatedFrom} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_RelatedFrom();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};