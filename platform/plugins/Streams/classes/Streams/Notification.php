<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Notification' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a notification row in the Streams database.
 *
 * @class Streams_Notification
 * @extends Base_Streams_Notification
 */
class Streams_Notification extends Base_Streams_Notification
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
	 * @return {Streams_Notification} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Notification();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};