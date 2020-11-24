<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Metrics' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a metrics row in the Streams database.
 *
 * @class Streams_Metrics
 * @extends Base_Streams_Metrics
 */
class Streams_Metrics extends Base_Streams_Metrics
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

	/*
	 * Add any Streams_Metrics methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Streams_Metrics} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Metrics();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};