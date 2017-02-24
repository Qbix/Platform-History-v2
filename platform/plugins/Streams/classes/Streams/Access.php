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
	 * Check if user "owns" a stream template for a publisher
	 * @method isTemplateOwner
	 * @static
	 * @param {string} $publisherId
	 * @param {string} $type
	 * @param {string|Users_User} [$user=null]
	 * @return {boolean}
	 */
	static function isTemplateOwner($publisherId, $type, $user = null) {
		if (!isset($user)) {
			$user = Users::loggedInUser();
		} else if (is_string($user)) {
			$user = Users_User::fetch($user);
		}
		if (!isset($user)) {
			return false;
		}

		// check if user is owner of stream template
		$stream = new Streams_Stream();
		$stream->publisherId = $publisherId;
		$stream->name = $type.'/';
		if (!$stream->retrieve()) {
			return false;
		}
		$stream->calculateAccess($user->id);
		return $stream->testAdminLevel('own');
	}
	
	/**
	 * Closes a stream, which prevents anyone from posting messages to it
	 * unless they have WRITE_LEVEL >= "close", as well as attempting to remove
	 * all relations to other streams. A "cron job" can later go and delete
	 * closed streams. The reason you should avoid deleting streams right away
	 * is that other subscribers may still want to receive the last messages
	 * posted to the stream.
	 * @method close
	 * @param {string} $asUserId The id of the user who would be closing the stream
	 * @param {string} $publisherId The id of the user publishing the stream
	 * @param {string} $streamName The name of the stream
	 * @param {array} [$options=array()] Can include "skipAccess"
	 * @static
	 */
	static function close($asUserId, $publisherId, $streamName, $options = array())
	{
		$stream = new Streams_Stream();
		$stream->publisherId = $publisherId;
		$stream->name = $streamName;
		if (!$stream->retrieve()) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'stream', 
				'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
			));
		}
		
		// Authorization check
		if (empty($options['skipAccess'])) {
			if ($asUserId !== $publisherId) {
				$stream->calculateAccess($asUserId);
				if (!$stream->testWriteLevel('close')) {
					throw new Users_Exception_NotAuthorized();
				}
			}
		}

		// Clean up relations from other streams to this category
		list($relations, $related) = Streams::related($asUserId, $stream->publisherId, $stream->name, true);
		foreach ($relations as $r) {
			try {
				Streams::unrelate(
					$asUserId, 
					$r->fromPublisherId, 
					$r->fromStreamName, 
					$r->type, 
					$stream->publisherId, 
					$stream->name
				);
			} catch (Exception $e) {}
		}

		// Clean up relations from this stream to categories
		list($relations, $related) = Streams::related(
			$asUserId,
			$stream->publisherId,
			$stream->name,
			false
		);
		foreach ($relations as $r) {
			try {
				Streams::unrelate(
					$asUserId, 
					$r->toPublisherId,
					$r->toStreamName,
					$r->type,
					$stream->publisherId,
					$stream->name
				);
			} catch (Exception $e) {}
		}

		$result = false;
		try {
			$db = $stream->db();
			$stream->closedTime = $closedTime = 
				$db->toDateTime($db->getCurrentTimestamp());
			if ($stream->save()) {
				$stream->post($asUserId, array(
					'type' => 'Streams/closed',
					'content' => '',
					'instructions' => compact('closedTime')
				), true);
				$result = true;
			}
		} catch (Exception$e) {
			throw $e;
		}
		return $result;
	}

	/**
	 * Get first and last name out of full name
	 * @method splitFullName
	 * @static
	 * @param {string} $fullName The string representing full name
	 * @return {array} array containing 'first' and 'last' properties
	 */
	static function splitFullName ($fullName) {
		$capitalize = Q_Config::get('Streams', 'inputs', 'fullName', 'capitalize', true);
		$last = null;
		if (strpos($fullName, ',') !== false) {
			list($last, $first) = explode(',', $fullName);
		} else if (strpos($fullName, ' ') !== false) {
			$parts = explode(' ', $fullName);
			if ($capitalize) {
				foreach ($parts as $k => $v) {
					$parts[$k] = ucfirst($v);
				}
			}
			$last = join(' ', array_slice($parts, 1));
			$first = $parts[0];
		} else {
			$first = $fullName;
		}
		$first = trim($first);
		$last = trim($last);

		return compact('first', 'last');
	}

	/**
	 * Registers a user. Can be hooked to 'Users/register' before event
	 * so it can override standard functionality.
	 * Method ensures user registration based on full name and also handles registration of
	 * invited user
	 * @method register
	 * @static
	 * @param {string} $fullName The full name of the user in the format 'First Last' or 'Last, First'
	 * @param {string|array} $identifier Can be an email address or mobile number. Or it could be an array of $type => $info
	 * @param {string} [$identifier.identifier] an email address or phone number
	 * @param {array} [$identifier.device] an array with keys "deviceId", "platform", "version"
	 *   to store in the Users_Device table for sending notifications
	 * @param {array} [$icon=array()] Array of filename => url pairs
	 * @param {string} [$provider=null] Provider such as "facebook"
	 * @param {array} [$options=array()] An array of options that could include:
	 * @param {string} [$options.activation] The key under "Users"/"transactional" config to use for sending an activation message. Set to false to skip sending the activation message for some reason.
	 * @return {Users_User}
	 * @throws {Q_Exception_WrongType} If identifier is not e-mail or modile
	 * @throws {Q_Exception} If user was already verified for someone else
	 * @throws {Users_Exception_AlreadyVerified} If user was already verified
	 * @throws {Users_Exception_UsernameExists} If username exists
	 */
	static function register(
		$fullName, 
		$identifier, 
		$icon = array(), 
		$provider = null, 
		$options = array())
	{
		if (is_array($provider)) {
			$options = $provider;
			$provider = null;
		}
		
		/**
		 * @event Streams/register {before}
		 * @param {string} username
		 * @param {string|array} identifier
		 * @param {string} icon
		 * @return {Users_User}
		 */
		$return = Q::event('Streams/register', compact(
			'name', 'fullName', 'identifier', 'icon', 'provider', 'options'), 'before'
		);
		if (isset($return)) {
			return $return;
		}

		// calculate first and last name out of name
		if (empty($fullName)) {
			throw new Q_Exception("Please enter your name", 'name');
		}

		$register = self::splitFullName($fullName);
		if (empty($register['first']) && empty($register['last'])) {
			// this is unlikely to happen
			throw new Q_Exception("Please enter your name properly", 'name');
		}

		// this will be used in Streams_after_Users_User_saveExecute
		Streams::$cache['register'] = $register;

		$user = Users::register("", $identifier, $icon, $provider, $options);

		/**
		 * @event Streams/register {after}
		 * @param {string} username
		 * @param {string|array} identifier
		 * @param {string} icon
		 * @param {Users_User} 'user'
		 * @return {Users_User}
		 */
		Q::event('Streams/register', compact(
			'register', 'identifier', 'icon', 'user', 'provider', 'options'
		), 'after');

		return $user;
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
		Streams::updateAvatars($this->publisherId, $tainted_access, $this->streamName);
		if (!empty($this->publisherId) and !empty($this->streamName)
		and !in_array(substr($this->streamName, -1), array('/', '*'))) {
			$asUserId = isset($this->grantedByUserId) ? $this->grantedByUserId : Q::app();
			Streams_Message::post($asUserId, $this->publisherId, $this->streamName, array(
				'type' => 'Streams/access/save',
				'instructions' => Q::take($this->fields, array(
					'readLevel', 'writeLevel', 'adminLevel', 'permissions',
					'ofUserId', 'ofContactLabel'
				))
			), true);
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