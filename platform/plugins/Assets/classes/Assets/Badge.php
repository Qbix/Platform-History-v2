<?php
/**
 * @module Assets
 */
/**
 * Class representing 'Badge' rows in the 'Assets' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a badge row in the Assets database.
 *
 * @class Assets_Badge
 * @extends Base_Assets_Badge
 */
class Assets_Badge extends Base_Assets_Badge
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
	 * @return {Assets_Badge} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Assets_Badge();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};