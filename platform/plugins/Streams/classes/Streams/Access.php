<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Access' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a access row in the Streams database.
 *
 * @class Streams_Access
 * @extends Base_Streams_Access
 */
class Streams_Access extends Base_Streams_Access
{
	function __construct ($fields = array(), $doInit = true)
	{
		parent::__construct($fields, $doInit);
		// set safe defaults
		foreach (array('readLevel', 'writeLevel',  'adminLevel') as $f) {
			if (!isset($fields[$f])) {
				$this->$f = -1;
			}
		}
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
	 * @method getAllPermissions
	 * @return {array}
	 */
	function getAllPermissions()
	{
		if ($permissions = $this->permissions) {
			return Q::json_decode($permissions, true);
		}
		return array();
	}
	
	/**
	 * @method hasPermission
	 * @param {string} $permission
	 * @return {boolean}
	 */
	function hasPermission($permission)
	{
		return in_array($permission, $this->getAllPermissions());
	}
	
	/**
	 * @method addPermission
	 * @param {string} $permission
	 */
	function addPermission($permission)
	{
		$permissions = $this->getAllPermissions();
		if (!in_array($permission, $permissions)) {
			$permissions[] = $permission;
			$this->permissions = Q::json_encode($permissions);
		}
	}
	
	/**
	 * @method removePermission
	 * @param {string} $permission
	 */
	function removePermission($permission)
	{
		$permissions = array_diff($this->getAllPermissions(), array($permission));
		$this->permissions = Q::json_encode($permissions);
	}
	
	/**
	 * Method is called before setting the field and verifies that, if it is a string,
	 * it contains a JSON array.
	 * @method beforeSet_permissions
	 * @param {string} $value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if $value is not string or is exceedingly long
	 */
	function beforeSet_permissions($value)
	{
		if (is_string($value)) {
			$decoded = Q::json_decode($value, true);
			if (!is_array($decoded) or Q::isAssociative($decoded)) {
				throw new Q_Exception_WrongValue(array('field' => 'permissions', 'range' => 'JSON array'));
			}
		}
		return parent::beforeSet_permissions($value);
	}

	/**
	 * Keeps Access table consistent on row insert/update and update avatar
	 * @method beforeSaveExecute
	 * @param {Db_Query} $query
	 *	The query being excecuted
	 * @param {array} $modifiedFields
	 *	Modified fields
	 * @param {array|null} $where
	 *	Primary key value for existing row
	 * @return {Db_Query}
	 */
	function beforeSaveExecute($query, $modifiedFields, $where)
	{
		$tainted_access = array($this);
		if ($this->get('removed', false)) {
			$this->set('removed', false);
		}
		if (!empty($this->publisherId) and !empty($this->streamName)) {
			Streams_Avatar::updateAvatars($this->publisherId, $tainted_access, $this->streamName);
			if (!in_array(substr($this->streamName, -1), array('/', '*'))) {
				$asUserId = isset($this->grantedByUserId) ? $this->grantedByUserId : Q::app();
				Streams_Message::post($asUserId, $this->publisherId, $this->streamName, array(
					'type' => 'Streams/access/save',
					'instructions' => Q::take($this->fields, array(
						'readLevel', 'writeLevel', 'adminLevel', 'permissions',
						'ofUserId', 'ofContactLabel'
					))
				), true);
			}
		}
		return $query;
	}

	/**
	 * Keeps Access table consistent on row deletion and update avatar
	 * @method afterRemoveExecute
	 * @param {Db_Result} $result
	 *	Query result
	 * @param {array} $query
	 *	The query which has been excecuted
	 * @return {Db_Result}
	 */	
	function afterRemoveExecute($result, $query)
	{
		if (!empty($this->ofUserId)) {
			// Removed an access for a specific user
			Streams_Avatar::updateAvatar($this->ofUserId, $this->publisherId);
			return $result;
		}
		
		if (empty($this->ofContactLabel)) {
			return $result;
		}
		
		// Update all avatars corresponding to access rows for this stream
		$tainted_access = Streams_Access::select()
			->where(array(
				'publisherId' => $this->publisherId,
				'streamName' => $this->streamName
			))->fetchDbRows();
		$found = false;
		foreach ($tainted_access as $ca) {
			if ($ca->ofContactLabel === $this->ofContactLabel) {
				// this should never really happen, since the row was just deleted
				$found = true;
				$ca->set('removed', true);
			}
		}
		if (!$found) {
			$this->set('removed', true);
			$tainted_access[] = $this;
		}
		Streams_Avatar::updateAvatars($this->publisherId, $tainted_access, $this->streamName);
		if (!empty($this->publisherId) and !empty($this->streamName)
		and !in_array(substr($this->streamName, -1), array('/', '*'))) {
			$asUserId = isset($this->grantedByUserId) ? $this->grantedByUserId : Q::app();
			Streams_Message::post($asUserId, $this->publisherId, $this->streamName, array(
				'type' => 'Streams/access/remove',
				'instructions' => Q::take($this->fields, array(
					'readLevel', 'writeLevel', 'adminLevel', 'permissions',
					'ofUserId', 'ofContactLabel'
				))
			), true);
		}
		return $result;
	}

	/**
	 * Check if one of ofUserId or ofContactLabel is set
	 * @method beforeSave
	 * @param {array} $value
	 *	The array of fields
	 * @return {array}
	 * @throws {Exception}
	 *	If mandatory field is not set
	 */
	function beforeSave($value)
	{
		if (!$this->retrieved) {
			$table = $this->getTable();
			if (empty($value['ofUserId']) && empty($value['ofContactLabel'])
			or !empty($value['ofUserId']) && !empty($value['ofContactLabel'])) {
				throw new Exception("exactly one of fields 'ofUserId' and 'ofContactLabel' can be set in table $table.");
			}
		}
		foreach (array('ofUserId', 'ofContactLabel') as $f) {
			if (isset($value[$f]) and $value[$f] != $this->fields[$f]) {
				throw new Q_Exception_WrongValue(array('field' => $f, 'range' => 'no change'));
			}
		}
		return parent::beforeSave($value);			
	}
	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Access} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Access();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};