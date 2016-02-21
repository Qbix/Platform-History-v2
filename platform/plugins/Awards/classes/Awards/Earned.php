<?php
/**
 * @module Awards
 */
/**
 * Class representing 'Earned' rows in the 'Awards' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a earned row in the Awards database.
 *
 * @class Awards_Earned
 * @extends Base_Awards_Earned
 */
class Awards_Earned extends Base_Awards_Earned
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
	 * @return {Awards_Earned} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Awards_Earned();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};