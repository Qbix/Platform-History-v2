<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Sent' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a sent row in the Streams database.
 *
 * @class Streams_Sent
 * @extends Base_Streams_Sent
 */
class Streams_Sent extends Base_Streams_Sent
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
	 * @return {Streams_Sent} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Sent();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};