<?php
/**
 * @module Places
 */
/**
 * Class representing 'Autocomplete' rows in the 'Places' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a autocomplete row in the Places database.
 *
 * @class Places_Autocomplete
 * @extends Base_Places_Autocomplete
 */
class Places_Autocomplete extends Base_Places_Autocomplete
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

	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Places_Autocomplete} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Places_Autocomplete();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};