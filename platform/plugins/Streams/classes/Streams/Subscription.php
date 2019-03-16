<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Subscription' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a subscription row in the Streams database.
 *
 * @class Streams_Subscription
 * @extends Base_Streams_Subscription
 */
class Streams_Subscription extends Base_Streams_Subscription
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
	 * @return {Streams_Subscription} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Subscription();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};