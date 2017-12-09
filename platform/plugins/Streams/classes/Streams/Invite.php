<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Invite' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a invite row in the Streams database.
 *
 * @class Streams_Invite
 * @extends Base_Streams_Invite
 */
class Streams_Invite extends Base_Streams_Invite
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
	 * Get the invites that have been left for one or more users in some stream.
	 * This is useful for auto-accepting them or presenting the user with a
	 * button to accept the invite when the stream is rendered on their client.
	 * @method forStream
	 * @static
	 * @param {string} $publisherId
	 * @param {string|array|Db_Expression} $streamName
	 * @param {string|array|Db_Expression} $userId
	 * @return {array|Streams_Invite|null} an array of Streams_Invite objects,
	 *  or if $streamName and $userId are strings, just returns Streams_Invite or null.
	 */
	static function forStream($publisherId, $streamName, $userId)
	{
		$rows = Streams_Invite::select()->where(
			compact('publisherId', 'streamName', 'userId')
		)->fetchDbRows();
		if (!is_string($streamName) || !is_string($userId)) {
			return $rows;
		}
		$row = reset($rows);
		return $row ? $row : null;
	}
	
	/**
	 * Accept the invite and set up user's access levels
	 * If invite was already accepted, this function simply returns null
	 * @method accept
	 * @param {array} $options Things to do with the logged-in user
	 * @param {boolean} [$options.subscribe=false]
	 *  Whether to auto-subscribe them to the stream if not already subscribed.
	 *  If the subscribe() call throws an exception, it is swallowed.
	 * @param {boolean} [$options.access=true]
	 *  Whether to upgrade their access to the stream
	 * @return {Streams_Participant|false|null}
	 * @throws {Users_Exception_NotLoggedIn}
	 *  If the $this->userId is false and user is not logged in
	 */
	function accept($options = array())
	{
		if (!isset($options['access'])) {
			$options['access'] = true;
		}
		
		$userId = $this->userId ? $this->userId : Users::loggedInUser(true)->id;
		
		if (!$this->userId) {
			$invited = new Streams_Invited();
			$invited->token = $this->token;
			$invited->userId = $userId;
			if (!$invited->retrieve() or $invited->state !== 'accepted') {
				$invited2 = new Streams_Invited();
				$invited2->token = $invited->token;
				$invited2->userId = $invited->userId;
				$invited2->state = 'accepted';
				$invited2->expireTime = $this->expireTime;
				$invited2->save();
			}
		}
		
		/**
		 * @event Streams/invite {before}
		 * @param {Streams_Invite} stream
		 * @param {Users_User} user
		 */
		$invite = $this;
		if (Q::event("Streams/invite/accept", compact('invite'), 'before') === false) {
			return false;
		}

		$this->state = 'accepted';
		if (!$this->save()) {
			return false;
		}
		
		$stream = Streams::fetchOne(
			$this->userId, $this->publisherId, $this->streamName, true
		);
	
		$participant = new Streams_Participant();
		$participant->publisherId = $this->publisherId; // shouldn't change
		$participant->streamName = $this->streamName; // shouldn't change
		$participant->streamType = $stream->type; // shouldn't change
		$participant->userId = $userId; // shouldn't change
		$participant->state = 'participating'; // since invite was accepted, user has begun participating in the stream
		$participant->save(true);
		
		if (!empty($options['access'])) {
			// Check if the users exist
			$invitedUser = Users_User::fetch($userId, true);
			$byUser = Users_User::fetch($this->invitingUserId, true);
			// Set up the objects
			$byStream = Streams::fetchOne(
				$this->invitingUserId, $this->publisherId, $this->streamName, true
			);
			$access = new Streams_Access();
			$access->publisherId = $byStream->publisherId;
			$access->streamName = $byStream->name;
			$access->ofUserId = $this->userId;
			// Check if we should update the access
			$shouldUpdateAccess = false;
			foreach (array('readLevel', 'writeLevel', 'adminLevel') as $level_type) {
				$access->$level_type = -1;
				if (empty($this->$level_type)) {
					continue;
				}
				// Give access level from the invite.
				// However, if inviting user has a lower access level now,
				// then give that level instead, unless it is lower than
				// what the invited user would have had otherwise.
				$min = min($this->$level_type, $byStream->get($level_type, 0));
				if ($min > $stream->get($level_type, 0)) {
					$access->$level_type = $min;
					$shouldUpdateAccess = true;
				}
			}
			if (!empty($access->permissions)) {
				// Grant permissions originally offered in the invite,
				// up to and including what the inviting user currently has.
				$permissions = Q::json_decode($access->permissions);
				$byPermissions = $byStream->get('permissions', array());
				foreach ($permissions as $permission) {
					if (in_array($permission, $byPermissions)) {
						$access->addPermission($permission);
					}
				}
			}
			if ($shouldUpdateAccess) {
				$access->save(true);
			}
		}
		
		if (!empty($options['subscribe']) and !$stream->subscription($userId)) {
			try {
				$stream->subscribe();
			} catch (Exception $e) {
				// Swallow this exception. If the caller wanted to catch
				// this exception, hey could have written this code block themselves.
			}
		}
		
		/**
		 * @event Streams/invite {after}
		 * @param {Streams_Invite} stream
		 * @param {Users_User} user
		 */
		Q::event("Streams/invite/accept", compact('invite', 'participant'), 'after');

		Streams_Message::post($userId, $this->publisherId, $this->streamName, array(
			'type' => 'Streams/invite/accept',
			'instructions' => Q::take($this->fields, array(
				'token', 'userId', 'invitingUserId', 'appUrl',
				'readLevel', 'writeLevel', 'adminLevel', 'permissions',
				'ofUserId', 'ofContactLabel'
			))
		), true);

		return true;
	}
	
	function decline()
	{
		$this->state = 'declined';
		$this->save();
	}

	/**
	 * Retrieves invite
	 * @method getInvite
	 * @static
	 * @param {string} $token
	 * @param {boolean} $throwIfMissing
	 * @return {Streams_Invite|null}
	 */

	static function fromToken ($token, $throwIfMissing = false) {
		if (empty($token)) {
			return null;
		}
		if (!empty(self::$cache['getInvite'][$token])) {
			return self::$cache['getInvite'][$token];
		}
		$invite = new Streams_Invite();
		$invite->token = $token;
		if (!$invite->retrieve()) {
			if ($throwIfMissing) {
				throw new Q_Exception_MissingRow(array(
					'table' => 'Invite',
					'criteria' => Q::json_encode(compact('token'))
				));
			}
			return null;
		}
		self::$cache['getInvite'][$token] = $invite;
		return $invite;
	}

	/**
	 * Assigns unique id to 'token' field if not set
	 * Saves corresponding row in Streams_Invited table
	 * Inserting a new invite affects corresponding row in Streams_Participant table
	 * @method beforeSave
	 * @param {array} $modifiedFields
	 *	The fields that have been modified
	 * @return {array}
	 */
	function beforeSave($modifiedFields)
	{
		if (!$this->retrieved) {
			if (!isset($modifiedFields['token'])) {
				$this->token = $modifiedFields['token'] = self::db()->uniqueId(
					self::table(),
					'token',
					null,
					array(
						'length' => Q_Config::get('Streams', 'invites', 'tokens', 'length', 16),
						'characters' => Q_Config::get('Streams', 'invites', 'tokens', 'characters', 'abcdefghijklmnopqrstuvwxyz')
					)
				);
			}
			if (!empty($modifiedFields['userId'])) {
				$p = new Streams_Participant();
				$p->publisherId = $modifiedFields['publisherId'];
				$p->streamName = $modifiedFields['streamName'];
				$p->userId = $modifiedFields['userId'];
				$p->state = 'invited';
				$p->save(true);
			}
		}

		if (!empty($modifiedFields['userId'])) {
			if (array_key_exists('state', $modifiedFields)
			or array_key_exists('expireTime', $modifiedFields)) {
				$invited = new Streams_Invited();
				$invited->userId = $this->userId; // shouldn't change
				$invited->token = $this->token; // shouldn't change
				if (array_key_exists('state', $modifiedFields)) {
					$invited->state = $modifiedFields['state'];
				}
				if (array_key_exists('expireTime', $modifiedFields)) {
					$invited->expireTime = $modifiedFields['expireTime'];
				}
				$invited->save(true);
			}
		}
		
		return parent::beforeSave($modifiedFields);
	}
	
	/**
	 * Also removes counterpart row in Streams_Invited table
	 * @method beforeSave
	 * @param {array} $pk
	 *	The primary key fields
	 * @return {boolean}
	 */
	function beforeRemove($pk)
	{
		if ($this->userId) {
			$invited = new Streams_Invited();
			$invited->userId = $this->userId;
			$invited->token = $this->token;
			$invited->remove();
		}
		return true;
	}
	
	static protected $cache = array();

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Invite} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Invite();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};