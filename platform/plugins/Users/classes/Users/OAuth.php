<?php
/**
 * @module Users
 */
/**
 * Class representing 'OAuth' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a oAuth row in the Users database.
 *
 * @class Users_OAuth
 * @extends Base_Users_OAuth
 */
class Users_OAuth extends Base_Users_OAuth
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
	 * @return {Users_OAuth} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_OAuth();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};