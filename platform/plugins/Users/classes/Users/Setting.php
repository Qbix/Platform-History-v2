<?php
/**
 * @module Users
 */
/**
 * Class representing 'Setting' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a setting row in the Users database.
 *
 * @class Users_Setting
 * @extends Base_Users_Setting
 */
class Users_Setting extends Base_Users_Setting
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
	 * Add any Users_Setting methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Users_Setting} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Setting();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};