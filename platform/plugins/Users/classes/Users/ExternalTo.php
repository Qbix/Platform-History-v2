<?php

/**
 * @module Users
 */

/**
 * Interface that an adapter must support to extend the Users_ExternalFrom class.
 * @class Users_ExternalFrom_Interface
 * @static
 */

interface Users_ExternalTo_Interface
{

}

/**
 * Class representing 'ExternalTo' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a external_to row in the Users database.
 *
 * @class Users_ExternalTo
 * @extends Base_Users_ExternalTo
 */
class Users_ExternalTo extends Base_Users_ExternalTo
{
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
	 * @return Users_ExternalTo
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
		$className = "Users_ExternalTo_$platform";
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
	 * Assign 'xid' field if not set
	 * @method beforeSave
	 * @param {array} $modifiedFields
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
	
	function processPlatformResponse($data)
	{
		$this->accessToken = $data['access_token'];
		$this->expires = new Db_Expression("CURRENT_TIMESTAMP + INTERVAL $data[expires_in] SECOND");
		if (!empty($data['refreshToken'])) {
			$this->setExtra('refreshToken', $data['refreshToken']);
		}
		if (empty($this->xid)) {
			$this->xid = '';
		}
		if (!empty($scope)) {
			$this->setExtra('scope', $data['scope']);
		}
		$this->save();
	}
	
	function refreshToken()
	{
		$token = $this->getExtra('refreshToken');
		if (!$token) {
			throw new Q_Exception_MissingObject(array('name' => 'refreshToken'));
		}
		$params = array(
			'grant_type' => 'refresh_token',
			'refresh_token' => $token,
			'platform' => $this->platform,
			'client_id' => $this->appId
		);
		$response = Q_Utils::post($tokenUri, $params);
		$data = Q::json_decode($response, true);
		$this->processPlatformResponse($data);
	}
	
	/**
	 * Inserts or updates a corresponding Users_ExternalFrom row
	 * @method afterSaveExecute
	 * @param {Db_Result} $result
	 * @return {array}
	 */
	function afterSaveExecute($result)
	{
		if (empty($this->xid)) {
			// don't save it if xid is empty
			Users_ExternalFrom::insert($this->fields)
				->onDuplicateKeyUpdate($this->fields)
				->execute();
		}
		return $result;
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_ExternalTo} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_ExternalTo();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};