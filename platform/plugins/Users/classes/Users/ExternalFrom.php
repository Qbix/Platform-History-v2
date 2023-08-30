<?php
/**
 * @module Users
 */

/**
 * Interface that an adapter must support to extend the Users_ExternalFrom class.
 * @class Users_ExternalFrom_Interface
 * @static
 */

interface Users_ExternalFrom_Interface
{
	/**
	 * Interface class for external platforms, for Platform adapters.
	 * @method authenticate
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an internal appId or a platform appId.
	 * @param {boolean} [$setCookie=true] Whether to set a cookie to do auth in subsequent requests
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_Platform_Facebook|null} Facebook object
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true);
		
	/**
	 * Gets the logged-in user icon urls
	 * @param {array} [$sizes=Q_Image::getSizes('Users/icon')]
	 *  An array of size strings such "80x80"
	 * @return {array|null} [$suffix=''] Keys are the size strings with optional $suffix
	 *  and values are the urls
	 */
	function icon($sizes = null, $suffix = '');

	/**
	 * Import some fields from facebook. Also fills Users::$cache['platformUserData'].
	 * @param {array} $fields
	 * @return {array}
	 */
	function import($fields);
	
}

/**
 * Class representing 'ExternalFrom' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a external_from row in the Users database.
 *
 * @class Users_ExternalFrom
 * @extends Base_Users_ExternalFrom
 */
class Users_ExternalFrom extends Base_Users_ExternalFrom
{
	/**
	 * Checks the request and cookies to possibly find information about
	 * an external platform app user. How this is done depends on the platform.
	 * If found, returns an instance of the class named Users_ExternalFrom_Foo
	 * where Foo = ucfirst(strtolower($platform)).
	 * It is your job to populate it with a user id and save it.
	 * @method authenticated
	 * @static
	 * @param {string} $platform
	 * @param {string} [$appId=Q::app()] optionally indicate the appId on the platform
	 * @return {Users_ExternalFrom_Interface|null}
	 *   May return null if no ExternalFrom was authenticated.
	 * @throws Q_Exception_MissingClass
	 */
	static function authenticate($platform, $appId = null)
	{
		static $result = array();
		if (!isset($appId)) {
			$appId = Q::app();
		}
		list($appId, $appInfo) = Users::appInfo($platform, $appId);
		$appIdForAuth = !empty($appInfo['appIdForAuth'])
			? $appInfo['appIdForAuth']
			: $appInfo['appId'];
		if (isset($result[$platform][$appIdForAuth])) {
			return $result[$platform][$appIdForAuth];
		}
		$className = "Users_ExternalFrom_".ucfirst(strtolower($platform));
		if (!class_exists($className, true)) {
			throw new Q_Exception_MissingClass(@compact('className'));
		}
		return $result[$platform][$appIdForAuth] = call_user_func(array($className, 'authenticate'), $appId);
	}

	/**
	 * Return a label for Users_Label row, from a suffix.
	 * @return {string} of the form {{platform}}_{{app}}/{{suffix}}
	 */
	function label($suffix)
	{
		return Users_Label::external(
			$this->platform, $this->appId, $suffix
		);
	}
	
	/**
	 * @method getAllExtras
	 * @return {array} The array of all extras set in the stream
	 */
	function getAllExtras()
	{
		return empty($this->extra) 
			? array()
			: json_decode($this->extra, true);
	}
	
	/**
	 * @method getExtra
	 * @param {string} $extraName The name of the extra to get
	 * @param {mixed} $default The value to return if the extra is missing
	 * @return {mixed} The value of the extra, or the default value, or null
	 */
	function getExtra($extraName, $default = null)
	{
		$attr = $this->getAllExtras();
		return isset($attr[$extraName]) ? $attr[$extraName] : $default;
	}
	
	/**
	 * @method setExtra
	 * @param {string} $extraName The name of the extra to set,
	 *  or an array of $extraName => $extraValue pairs
	 * @param {mixed} $value The value to set the extra to
	 * @return Users_ExternalFrom
	 */
	function setExtra($extraName, $value = null)
	{
		$attr = $this->getAllExtras();
		if (is_array($extraName)) {
			foreach ($extraName as $k => $v) {
				$attr[$k] = $v;
			}
		} else {
			$attr[$extraName] = $value;
		}
		$this->extra = Q::json_encode($attr);

		return $this;
	}
	
	/**
	 * @method clearExtra
	 * @param {string} $extraName The name of the extra to remove
	 */
	function clearExtra($extraName)
	{
		$attr = $this->getAllExtras();
		unset($attr[$extraName]);
		$this->extra = Q::json_encode($attr);
	}
	
	/**
	 * @method clearAllExtras
	 */
	function clearAllExtras()
	{
		$this->extra = '{}';
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
		$className = "Users_ExternalFrom_$platform";
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
	 * Assigns a unique (and random) 'xid' field if not set
	 * @method beforeSave
	 * @param {array} $updatedFields
	 * @return {array}
	 */
	function beforeSave($updatedFields)
	{
		if (!$this->retrieved) {
			if (!isset($updatedFields['xid'])) {
				$this->xid = $updatedFields['xid'] = 
				self::db()->uniqueId(self::table(), 'xid', null);
			}
		}
		return parent::beforeSave($updatedFields);
	}
	
	/**
	 * Inserts or updates a corresponding Users_ExternalTo row
	 * @method afterSaveExecute
	 * @param {Db_Result} $result
	 * @return {array}
	 */
	function afterSaveExecute($result)
	{
		Users_ExternalTo::insert($this->fields)
			->onDuplicateKeyUpdate($this->fields)
			->execute();
		return $result;
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_ExternalFrom} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_ExternalFrom();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};