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
	 * Returns the shareable URL corresponding to the invite
	 * @return {string}
	 */
	function url()
	{
		return Streams::inviteUrl($this->token);
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
	 * @return {array} an array of Streams_Invite objects
	 */
	static function forStream($publisherId, $streamName, $userId = null)
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser()->id;
			if ($user) {
				return null;
			}
			$userId = $user->id;
		}
		return Streams_Invite::select()->where(
			@compact('publisherId', 'streamName', 'userId')
		)->fetchDbRows();
	}
	
	/**
	 * Call this to check if the user is not yet participating in the stream,
	 * and has an invite pending. If so, a notice is set, with a button to accept
	 * the invite.
	 * @param {Streams_Stream} $stream The stream to check
	 * @param {array} [$options=array()] Options to pass to Q_Response::setNotice(),
	 *  and also these:
	 * @param {string|array} [$options.notice] Information for the notice
	 * @param {string|array} [$options.notice.html] HTML to display in the notice.
	 *  This is a handlebars template which receives the fields
	 *  {{stream}}, {{clickOrTap}} and {{ClickOrTap}}.
	 *  Defaults to the array("Streams/content", array("invite", "notice", "html"))
	 * @param {array} [$options.userId=Users::loggedInUser()->id] The user to check
	 * @return {boolean} Whether the notice was set
	 */
	static function possibleNotice($stream, $options = array())
	{
		$userId = Q::ifset($options, 'userId', null);
		if (!$userId) {
			$user = Users::loggedInUser(false, false);
			if (!$user) {
				return false;
			}
			$userId = $user->id;
		}
		if (!($stream instanceof Streams_Stream) || $stream->participant()) {
			return false;
		}
		$invites = Streams_Invite::forStream($stream->publisherId, $stream->name, $userId);
		$invite = reset($invites); // for now just take the first one you find
		if (!$invite or $invite->state !== 'pending') {
			return false;
		}
		$defaultHtml = array("Streams/content", array("invite", "notice", "html"));
		$html = Q::ifset($options, 'notice', 'html', null, $defaultHtml);
		$button = '<button class="Streams_possibleNotice_button">';
		$clickOrTap = Q_Text::clickOrTap(false);
		$ClickOrTap = Q_Text::clickOrTap(true);
		$buttonClass = 'Streams_invite_accept_button';
		$html = Q_Handlebars::render($html, @compact(
			'stream', 'clickOrTap', 'ClickOrTap'
		));
		$key = 'Streams_Invite_possibleNotice';
		$options['handler'] = $invite->url();
		Q_Response::setNotice($key, $html, $options);
		return true;
	}
	
	/**
	 * Accept the invite and set up the user's access levels
	 * If invite was already accepted, this function simply returns null
	 * @method accept
	 * @param {array} $options
	 *  These options are passed to stream->subscribe() and stream->join()
	 *  but can also include the following:
	 * @param {boolean} [$options.subscribe=false]
	 *  Whether to auto-subscribe them to the stream if not already subscribed.
	 *  If the subscribe() call throws an exception, it is swallowed.
	 * @param {boolean} [$options.access=true]
	 *  Whether to upgrade the user's access to the stream, based on the invite
	 * @return {Streams_Participant|false|null}
	 * @throws {Users_Exception_NotLoggedIn}
	 *  If the $this->userId is false and user is not logged in
	 */
	function accept($options = array())
	{
		if (!isset($options['access'])) {
			$options['access'] = true;
		}

		$saved = false;
		$userId = $this->userId ? $this->userId : Users::loggedInUser(true)->id;
		
		$invited = new Streams_Invited();
		$invited->token = $this->token;
		$invited->userId = $userId;
		if ($this->userId) {
			if ($this->state == 'accepted') {
				return false; // already exists
			}
			$invited->state = 'accepted';
			$invited->save(true);
			$saved = true;
		} else if (!$invited->retrieve() or $invited->state !== 'accepted') {
			$quotaName = "Streams/invite";
			$roles = Users::roles($this->publisherId, null, null, $userId);
			$quota = Users_Quota::check("", $this->token, $quotaName, true, 1, $roles);

			$invited2 = new Streams_Invited();
			$invited2->token = $invited->token;
			$invited2->userId = $invited->userId;
			if ($invited->retrieve()) {
				return false; // already exists
			}
			$invited2->state = 'accepted';
			$invited2->expireTime = $this->expireTime;
			$invited2->save();

			$quota->used(1);
			$saved = true;
		}

		if (!$saved) {
			return false;
		}

		/**
		 * @event Streams/invite {before}
		 * @param {Streams_Invite} stream
		 * @param {Users_User} user
		 */
		$invite = $this;
		if (Q::event("Streams/invite/accept", @compact('invite', 'userId'), 'before') === false) {
			return false;
		}

		// $this->userId = $userId;
		$this->state = 'accepted';
		if (!$this->save() and $this->userId) {
			return false;
		}

		$stream = Streams_Stream::fetch(
			$this->userId, $this->publisherId, $this->streamName, true
		);

		$instructions = Q::take($this->fields, array(
			'token', 'userId', 'invitingUserId', 'appUrl',
			'readLevel', 'writeLevel', 'adminLevel', 'permissions',
			'ofUserId', 'ofContactLabel'
		));

		$stream->post($userId, array(
			'type' => 'Streams/invite/accept',
			'instructions' => $instructions
		), true);

		$user = Users::fetch($userId, true);
		Q_Utils::sendToNode(array(
			"Q/method" => "Users/emitToUser",
			"userId" => $invite->invitingUserId,
			"event" => "Streams/invite/accept",
			"data" => array(
				"invitedUserId" => $userId,
				"displayName" => $user->displayName(),
				"icon" => $user->icon
			)
		));
		
		if (!empty($options['access'])) {
			// Check if the users exist
			$invitedUser = Users_User::fetch($userId, true);
			$byUser = Users_User::fetch($this->invitingUserId, true);
			// Set up the objects
			$toStream = Streams_Stream::fetch(
				$this->invitingUserId, $this->publisherId, $this->streamName, true
			);
			$access = new Streams_Access();
			$access->publisherId = $toStream->publisherId;
			$access->streamName = $toStream->name;
			$access->ofUserId = $userId;
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
				$min = min($this->$level_type, $toStream->get($level_type, 0));
				if ($min > $stream->get($level_type, 0)) {
					$access->$level_type = $min;
					$shouldUpdateAccess = true;
				}
			}
			if (!empty($access->permissions)) {
				// Grant permissions originally offered in the invite,
				// up to and including what the inviting user currently has.
				$permissions = Q::json_decode($access->permissions);
				$withPermissions = $toStream->get('permissions', array());
				foreach ($permissions as $permission) {
					if (in_array($permission, $withPermissions)) {
						$access->addPermission($permission);
					}
				}
			}
			if ($shouldUpdateAccess) {
				$access->save(true);
			}
		}

		// add roles
		$extra = Q::json_decode($this->extra ?: '{}', true);
		if ($labels = Q::ifset($extra, 'addLabel', null)) {
			if (!is_array($labels)) {
				$labels = array($labels);
			}
			$can = Users_Label::can($stream->publisherId, $this->invitingUserId);
			if ($can["manageContacts"]) {
				foreach ($labels as $label) {
					Users_Contact::addContact(
						$stream->publisherId, $label, $userId,
						null, $this->invitingUserId, true
					);
				}
			}
		}
		// add relationships
		if ($labels = Q::ifset($extra, 'addMyLabel', null)) {
			if (!is_array($labels)) {
				$labels = array($labels);
			}
			$can = Users_Label::can($stream->publisherId, $this->invitingUserId);
			if ($can["manageContacts"]) {
				foreach ($labels as $label) {
					Users_Contact::addContact(
						$this->invitingUserId, $label, $userId,
						null, $this->invitingUserId, true
					);
				}
			}
		}

		Users_Contact::addContact($this->invitingUserId, "Streams/invited", $userId, null, false, true);
		Users_Contact::addContact($this->invitingUserId, "Streams/invited/{$stream->type}", $userId, null, false, true);
		Users_Contact::addContact($userId, "Streams/invitedMe", $this->invitingUserId, null, false, true);
		Users_Contact::addContact($userId, "Streams/invitedMe/{$stream->type}", $this->invitingUserId, null, false, true);

		// subscribe or join, if needed
		$onInviteAccepted = Q_Config::get("Streams", "types", $stream->type, "onInviteAccepted", null);
		if ($onInviteAccepted) {
			$options["subscribe"] = $onInviteAccepted == "subscribe";
			$options["join"] = $onInviteAccepted == "join";
		}
		if (Q::ifset($options, "subscribe", false)) {
			$participant = new Streams_Participant();
			$participant->publisherId = $stream->publisherId;
			$participant->streamName = $stream->name;
			$participant->userId = $userId;
			$participant->state = "participating";
			$participant->subscribed = "yes";
			if (!$participant->retrieve()) {
				try {
					$extra = Q::ifset($options, 'extra', array());
					$configExtra = Streams_Stream::getConfigField($stream->type, array(
						'invite', 'extra'
					), array());
					$extra = array_merge($configExtra, $extra);
					$options['extra'] = $extra;
					$stream->subscribe($options);
				} catch (Exception $e) {
					// Swallow this exception. If the caller wanted to catch
					// this exception, they could have written this code block themselves.
				}
			}
		} else if (Q::ifset($options, "join", true)) {
			$stream->join($userId, $this->publisherId, $this->streamName, array(
				'extra' => array('Streams/invitingUserId' => $this->invitingUserId),
				'noVisit' => true
			));
		}

		/**
		 * @event Streams/invite {after}
		 * @param {Streams_Invite} stream
		 * @param {Users_User} user
		 */
		Q::event("Streams/invite/accept", @compact('invite', 'stream', 'userId'), 'after');

		return true;
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
					'criteria' => Q::json_encode(@compact('token'))
				));
			}
			return null;
		}
		self::$cache['getInvite'][$token] = $invite;
		return $invite;
	}
	
	/**
	 * Generate a unique token that can be used for invites
	 * @method generateToken
	 * @static
	 * @return {string}
	 */
	static function generateToken()
	{
		return self::db()->uniqueId(
			self::table(),
			'token',
			null,
			array(
				'length' => Q_Config::get('Streams', 'invites', 'tokens', 'length', 16),
				'characters' => Q_Config::get('Streams', 'invites', 'tokens', 'characters', 'abcdefghijklmnopqrstuvwxyz')
			)
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
	 * @return Streams_Invite
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
				$this->token = $modifiedFields['token'] = self::generateToken();
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