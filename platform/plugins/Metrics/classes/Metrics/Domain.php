<?php
/**
 * @module Metrics
 */
/**
 * Class representing 'Domain' rows in the 'Metrics' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a domain row in the Metrics database.
 *
 * @class Metrics_Domain
 * @extends Base_Metrics_Domain
 */
class Metrics_Domain extends Base_Metrics_Domain
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
	 * @return {Metrics_Domain} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Metrics_Domain();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};