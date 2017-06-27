<?php
/**
 * @module Users
 */

/**
 * Interface that an adapter must support to extend the Users_AppUser class.
 * @class Users_AppUser_Interface
 * @static
 */

interface Users_AppUser_Interface
{
	/**
	 * Interface class for external platforms, for Platform adapters.
	 * @class Users_AppUser_Interface
	 * @constructor
	 * @param {string} [$appId=Q::app()] Can either be an internal appId or a platform appId.
	 * @param {boolean} [$setCookie=true] Whether to set a cookie to do auth in subsequent requests
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_Platform_Facebook|null} Facebook object
	 */
	function __construct($appId = null, $setCookie = true, $longLived = true);
		
	/**
	 * Gets the logged-in user icon urls
	 * @param {array} $sizes=[Q_Config::expect('Users','icon','sizes')]
	 *  An array of size strings such "80x80"
	 * @return {array|null} Keys are the size strings with optional $suffix
	 *  and values are the urls
	 */
	function icon($sizes = null, $suffix = '');

	/**
	 * Get info about access token
	 * @method accessInfo
	 * @return {array} An array of ($accessToken, $sessionExpires)
	 *  where $sessionExpires may be null
	 */
	function accessInfo();

	/**
	 * Import some fields from facebook. Also fills Users::$cache['platformUserData'].
	 * @param {array} $fields
	 * @return {array}
	 */
	function import($fields);
	
}

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
	 * Checks the request and cookies to possibly find information about
	 * an external platform app user. How this is done depends on the platform.
	 * If found, returns an instance of the class named Users_AppUser_Foo
	 * where Foo = ucfirst(strtolower($platform)).
	 * It is your job to populate it with a user id and save it.
	 * @param {string} $platform
	 * @param {string} [$appId=Q::app()] optionally indicate the appId on the platform
	 * @return {Users_AppUser_Interface|null}
	 *   May return null if no AppUser was authenticated.
	 * @throws Q_Exception_MissingClass
	 */
	static function authenticate($platform, $appId = null)
	{
		static $result = array();
		if (!isset($appId)) {
			$appId = Q::app();
		}
		if (!isset($appId)) {
			$appId = Q::app();
		}
		list($appId, $appInfo) = Users::appInfo($platform, $appId);
		if (!$appId) {
			return null;
		}
		if (isset($result[$platform][$appId])) {
			return $result[$platform][$appId];
		}
		$className = "Users_AppUser_".ucfirst(strtolower($platform));
		if (!class_exists($className, true)) {
			throw new Q_Exception_MissingClass(compact('className'));
		}
		return call_user_func(array($className, 'authenticate'), $appId);
	}
	
	/**
	 * Called by various Db methods to get a custom row object
	 * @param {array} $fields Any fields to set in the row
	 * @param {string} [$stripPrefix=null] Any prefix to strip from the fields
	 * @return Users_Device
	 */
	static function newRow($fields, $stripPrefix = null)
	{
		Q_Valid::requireFields(array('platform', 'appId'), $fields, true);
		$platform = ucfirst(strtolower($fields['platform']));
		$className = "Users_AppUser_$platform";
		$row = new $className();
		return $row->copyFrom($fields, $stripPrefix, false, false);
	}
	
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