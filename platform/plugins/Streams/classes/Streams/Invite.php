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
	 * Accept the invite and set up user's access levels
	 * If invite was already accepted, this function simply returns null
	 * @method accept
	 * @return {Streams_Participant|false|null}
	 */
	function accept()
	{
		if ($this->state === 'accepted') {
			return null;
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
		
		$participant = new Streams_Participant();
		$participant->publisherId = $this->publisherId; // shouldn't change
		$participant->streamName = $this->streamName; // shouldn't change
		$participant->userId = $this->userId; // shouldn't change
		$participant->state = 'participating'; // since invite was accepted, user has begun participating in the stream
		$participant->reason = Q_Config::get('Streams', 'invites', 'participantReason', 'Accepted an invite');
		$participant->save(true);
		
		/**
		 * @event Streams/invite {after}
		 * @param {Streams_Invite} stream
		 * @param {Users_User} user
		 */
		Q::event("Streams/invite/accept", compact('invite', 'participant'), 'after');

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
	 * @return {Streams_Invite|null}
	 */

	static function fromToken ($token) {
		if (empty($token)) {
			return null;
		}
		if (!empty(self::$cache['getInvite'][$token])) {
			return self::$cache['getInvite'][$token];
		}
		$invite = new Streams_Invite();
		$invite->token = $token;
		if (!$invite->retrieve()) {
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
					array(
						'length' => Q_Config::get('Streams', 'invites', 'tokens', 'length', 16),
						'characters' => Q_Config::get('Streams', 'invites', 'tokens', 'characters', 'abcdefghijklmnopqrstuvwxyz')
					)
				);
			}
			$p = new Streams_Participant();
			$p->publisherId = $modifiedFields['publisherId'];
			$p->streamName = $modifiedFields['streamName'];
			$p->userId = $modifiedFields['userId'];
			if (!$p->retrieve()) {
				$p->state = 'invited';
				$p->reason = '';
				$p->save();
			}
		}

		if (array_key_exists('state', $modifiedFields) or array_key_exists('expireTime', $modifiedFields)) {
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
		$invited = new Streams_Invited();
		$invited->userId = $this->userId;
		$invited->token = $this->token;
		$invited->remove();
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