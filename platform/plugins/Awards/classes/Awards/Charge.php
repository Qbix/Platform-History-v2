<?php
/**
 * @module Awards
 */
/**
 * Class representing 'Charge' rows in the 'Awards' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a charge row in the Awards database.
 *
 * @class Awards_Charge
 * @extends Base_Awards_Charge
 */
class Awards_Charge extends Base_Awards_Charge
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

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Awards_Charge} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Awards_Charge();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};