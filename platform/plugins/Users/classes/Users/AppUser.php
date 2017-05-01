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
	 * If a user is logged in the platform, and the platform sent us
	 * some sort of signed request (which we may have saved in a cookie)
	 * this function returns the user's uid on that platform.
	 * @param $platform
	 * Instance of platform SDK object
	 * Right now it can only be \Facebook\Facebook,
	 * which you can obtain from Users::facebook()
	 */
	static function loggedInUid($platform)
	{
		if ($platform instanceof Facebook\Facebook
		and $app = $platform->getApp()) {
			if ($fbsr = Q::ifset($_COOKIE, 'fbsr_'.$app->getId(), null)) {
				$sr = new Facebook\SignedRequest($platform->getApp(), $fbsr);
				return $sr->getUserId();
			}
		}
		return null;
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