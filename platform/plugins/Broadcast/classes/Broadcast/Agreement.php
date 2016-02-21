<?php
/**
 * @module Broadcast
 */
/**
 * Class representing 'Agreement' rows in the 'Broadcast' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a agreement row in the Broadcast database.
 *
 * @class Broadcast_Agreement
 * @extends Base_Broadcast_Agreement
 */
class Broadcast_Agreement extends Base_Broadcast_Agreement
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
	 * @return {Broadcast_Agreement} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Broadcast_Agreement();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};