<?php
/**
 * @module Assets
 */
/**
 * Class representing 'Purchase' rows in the 'Assets' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a purchase row in the Assets database.
 *
 * @class Assets_Purchase
 * @extends Base_Assets_Purchase
 */
class Assets_Purchase extends Base_Assets_Purchase
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
	 * Add any Assets_Purchase methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Assets_Purchase} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Assets_Purchase();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};