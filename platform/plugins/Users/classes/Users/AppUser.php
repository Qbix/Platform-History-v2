<?php
/**
 * @module Users
 */
/**
 * Class representing 'AppUser' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a app_user row in the Users database.
 *
 * @class Users_AppUser
 * @extends Base_Users_AppUser
 */
class Users_AppUser extends Base_Users_AppUser
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
	 * @return {Users_AppUser} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_AppUser();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};