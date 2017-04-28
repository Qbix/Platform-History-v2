<?php
/**
 * @module Users
 */
/**
 * Class representing 'AppSession' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a app_session row in the Users database.
 *
 * @class Users_AppSession
 * @extends Base_Users_AppSession
 */
class Users_AppSession extends Base_Users_AppSession
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
	 * Add any Users_AppSession methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Users_AppSession} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_AppSession();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};