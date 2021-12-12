<?php
/**
 * @module Users
 */
/**
 * Class representing 'Permission' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a permission row in the Users database.
 *
 * @class Users_Permission
 * @extends Base_Users_Permission
 */
class Users_Permission extends Base_Users_Permission
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
	 * Add any Users_Permission methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Users_Permission} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Permission();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};