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
	 * Check if user has 'own' rights for a publisher
	 * @method isOwner
	 * @static
	 * @param {string} $publisherId
	 * @param {string} $type
	 * @param {string|Users_User} $user=null
	 * @return {boolean}
	 */
	static function isOwner($publisherId, $type, $user = null) {
		if (!isset($user)) {
			$user = Users::loggedInUser();
		} else if (is_string($user)) {
			$user = Users_User::fetch($user);
		}
		if (!isset($user)) return false;

		// check if user is owher of stream template
		$stream = new Streams_Stream();
		$stream->publisherId = $publisherId;
		$stream->name = $type.'/';
		if (!$stream->retrieve()) return false;
		$stream->calculateAccess($user->id);
		return $stream->testAdminLevel('own');
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
		Streams::updateAvatars($this->publisherId, $tainted_access, $this->streamName);
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
			Streams::updateAvatar($this->ofUserId, $this->publisherId);
			return $result;
		}
		
		if (empty($this->ofContactLabel)) {
			return $result;
		}
		
		// Update all avatars corresponding to access rows for this stream
		$tainted_access = Streams_Access::select('*')
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
		Streams::updateAvatars($this->publisherId, $tainted_access, $this->streamName);
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