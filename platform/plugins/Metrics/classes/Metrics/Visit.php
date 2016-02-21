<?php
/**
 * @module Metrics
 */
/**
 * Class representing 'Visit' rows in the 'Metrics' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a visit row in the Metrics database.
 *
 * @class Metrics_Visit
 * @extends Base_Metrics_Visit
 */
class Metrics_Visit extends Base_Metrics_Visit
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
	 * @return {Metrics_Visit} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Metrics_Visit();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};