<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Avatar' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a avatar row in the Streams database.
 *
 * @class Streams_Avatar
 * @extends Base_Streams_Avatar
 */
class Streams_Avatar extends Base_Streams_Avatar
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
	 * Retrieve avatars for one or more publishers as displayed to a particular user.
	 * 
	 * @method fetch
	 * @static
	 * @param $toUserId {User_User|string} The id of the user to which this would be displayed
	 * @param $publisherIds {string|array} Array of various users whose avatars are being fetched
	 * @param $indexField {string} Optional name of the field by which to index the resulting array. Can be "toUserId" or "publisherId"
	 * @return {Streams_Avatar|array}
	 */
	static function fetch($toUserId, $publisherId, $indexField = null) {
		if (!isset($toUserId)) {
			$toUserId = Users::loggedInUser();
			if (!$toUserId) $toUserId = "";
		}
		if ($toUserId instanceof Users_User) {
			$toUserId = $toUserId->id;
		}
		if ($publisherId instanceof Users_User) {
			$publisherId = $publisherId->id;
		}
		$return_one = false;
		if (!is_array($publisherId)) {
			$publisherId = array($publisherId);
			$return_one = true;
		}
		$rows = Streams_Avatar::select()->where(array(
			'toUserId' => array($toUserId, ''),
			'publisherId' => $publisherId
		))->fetchDbRows(null, '', $indexField);
		$avatars = array();
		foreach ($rows as $r) {
			if (!isset($avatars[$r->publisherId])
			or $r->toUserId !== '') {
				$avatars[$r->publisherId] = $r;
			}
		}
		return $return_one
			? ($avatars ? reset($avatars) : null)
			: $avatars;
	}

	/**
	 * Retrieve avatars for one or more publishers as displayed to a particular user.
	 * 
	 * @method fetchByPrefix
	 * @static
	 * @param $toUserId {User_User|string} The id of the user to which this would be displayed
	 * @param $prefix {string} The prefix for the firstName
	 * @param {array} $options=array()
	 *	'limit' => number of records to fetch
	 *  'fields' => defaults to array('username', 'firstName', 'lastName') 
	 *  'public' => defaults to false. If true, also gets publicly accessible names.
	 * @return {array}
	 */
	static function fetchByPrefix($toUserId, $prefix, $options = array()) {
		if ($toUserId instanceof Users_User) {
			$toUserId = $toUserId->id;
		}
		$toUserId = empty($options['public'])
			? $toUserId
			: array($toUserId, '');
		$fields = isset($options['fields'])
			? $options['fields']
			: array('firstName', 'lastName', 'username');
		$limit = isset($options['limit'])
			? $options['limit']
			: Q_Config::get('Users', 'Avatar', 'fetchByPrefix', 'limit', 100);
		$max = $limit;
		$avatars = array();
		$prefixes = preg_split("/\s+/", $prefix);
		$prefix = reset($prefixes);
		$criteria = array();
		if (count($prefixes) < 2) {
			foreach ($fields as $field) {
				$criteria[] = array(
					$field => new Db_Range($prefix, true, false, true)
				);	
			}
		} else {
			$criteria = array(
				array(
					'firstName' => new Db_Range($prefixes[0], true, false, true),
					'lastName' => new Db_Range($prefixes[1], true, false, true)
				),
				array(
					'firstName' => new Db_Range($prefixes[0], true, false, true),
					'username' => new Db_Range($prefixes[1], true, false, true)
				),
				array(
					'username' => new Db_Range($prefixes[0], true, false, true),
					'lastName' => new Db_Range($prefixes[1], true, false, true)
				)
			);
		}
		$count = count($criteria);
		for ($i=0; $i<$count; ++$i) {
			// NOTE: sharding should be done on toUserId only, not publisherId
			$q = Streams_Avatar::select()
				->where(array(
					'toUserId' => $toUserId
				))->andWhere($criteria[$i])
				->orderBy('firstName');
			$rows = $q->limit($max)->fetchDbRows();
			foreach ($rows as $r) {
				if (!isset($avatars[$r->publisherId])
				or $r->toUserId !== '') {
					$avatars[$r->publisherId] = $r;
				}
			}
			$max = $limit - count($avatars);
			if ($max <= 0) {
				break;
			}
		}
		return $avatars;
	}
	
	/**
	 * Calculate diplay name from avatar
	 * @method displayName
	 * @param {array} $options=array()
	 *  Associative array of options, which can include:<br/>
	 *   @param {boolean} [$options.short] Show one part of the name only
	 *   @param {boolean} [$options.show] The parts of the name to show. Can have "f", "fu", "l", "lu", "flu" and "u" separated by spaces. The "fu" and "lu" represent firstname or lastname with fallback to username, while "flu" is "firstname lastname" with a fallback to username.
	 *   @param {boolean} [$options.html] If true, encloses the first name, last name, username in span tags. If an array, then it will be used as the attributes of the html.
	 *   @param {boolean} [$options.escape] If true, does HTML escaping of the retrieved fields
	 * @param {string} [$fallback='Someone'] HTML to return if there is no info to get displayName from.
	 * @return {string|null}
	 */
	function displayName($options = array(), $fallback = 'Someone')
	{
		$fn = $this->firstName;
		$ln = $this->lastName;
		$u = $this->username;
		if (!empty($options['escape']) or !empty($options['html'])) {
			$fn = Q_Html::text($fn);
			$ln = Q_Html::text($ln);	
			$u = Q_Html::text($u);
			$fallback = Q_Html::text($fallback);
		}

		if (!empty($options['html'])) {
			$attributes = is_array($options['html'])
				? $options['html'] 
				: array();
			$class = isset($attributes['class'])
				? ' ' . $attributes['class']
				: '';
			$attributes['class'] = "Streams_firstName$class";
			$attr = Q_Html::attributes($attributes);
			$fn2 = "<span $attr>$fn</span>";
			$attributes['class'] = "Streams_lastName$class";
			$attr = Q_Html::attributes($attributes);
			$ln2 = "<span $attr>$ln</span>";
			$attributes['class'] = "Streams_username$class";
			$attr = Q_Html::attributes($attributes);
			$u2 = "<span $attr>$u</span>";
			$f2 = "<span $attr>$fallback</span>";
		} else {
			$fn2 = $fn;
			$ln2 = $ln;
			$u2 = $u;
			$f2 = $fallback;
		}

		// $u = $u ? "\"$username\"" : '';

		if (!empty($options['show'])) {
			$show = array_map('trim', explode(' ', $options['show']));
			$parts = array();
			foreach ($show as $s) {
				switch ($s) {
				case 'f': $parts[] = $fn2; break;
				case 'l': $parts[] = $ln2; break;
				case 'u': $parts[] = $u2; break;
				case 'fu': $parts[] = $fn2 ? $fn2 : $u2; break;
				case 'lu': $parts[] = $ln2 ? $ln2 : $u2; break;
				case 'flu':
				default:
					$parts[] = ($fn2 || $ln2)
						? implode(' ', array($fn2, $ln2))
						: $u2;
					break;
				}
			}
			$result = trim(implode(' ', $parts));
			return $result ? $result : $fallback;
		}

		if (!empty($options['short'])) {
			return $fn ? $fn2 : ($u ? $u2 : $f2);
		} else if ($fn and $ln) {
			return "$fn2 $ln2";
		} else if ($fn and !$ln) {
			return $u ? "$fn2 $u2" : $fn2;
		} else if (!$fn and $ln) {
			return $u ? "$u2 $ln2" : $ln2;
		} else {
			return $u ? $u2 : $f2;
		}
	}

	/**
	 * Get the url of the user icon from a Streams.Avatar
	 * @method
	 * @param {string} [$basename=null] The last part after the slash, such as "50.png"
	 * @return {string} the url
	 */
	function iconUrl ($basename = null)
	{
		$icon = Q::interpolate($this->icon, array(
			'userId' => Q_Utils::splitId($this->publisherId)
		));
		return Users::iconUrl($icon, $basename);
	}
	
	/**
	 * Updates the publisher's avatar, as it appears to $toUserId
	 * This function should be called during events that may cause the
	 * publisher's avatar to change appearance for certain users viewing it.
	 * These are usually rare events, and include things like:<br/>
	 *   adding, removing or modifying a contact
	 * @method updateAvatar
	 * @static
	 * @param {integer} $toUserId
	 *  id of the user who will be viewing this avatar
	 * @param {string} $publisherId
	 *  id of the publisher whose avatar to update
	 * @return {boolean}
	 */
	static function updateAvatar($toUserId, $publisherId)
	{
		$user = new Users_User();
		$user->id = $publisherId;
		if (!$user->retrieve(null, null, true)->ignoreCache()->resume()) {
			return false;
		}

		// Fetch some streams as the contact user
		$streams = Streams::fetch($toUserId, $publisherId, array(
			'Streams/user/firstName', 'Streams/user/lastName', 'Streams/user/gender'
		));
		$firstName = Streams::take($streams, 'Streams/user/firstName', 'content');
		$lastName = Streams::take($streams, 'Streams/user/lastName', 'content');
		$gender = Streams::take($streams, 'Streams/user/gender', 'content');

		// Update the Streams_avatar table
		Streams_Avatar::update()->set(array(
			'firstName' => $firstName,
			'lastName' => $lastName,
			'gender' => $gender,
			'username' => $user->username,
			'icon' => $user->icon
		))->where(array(
			'toUserId' => $toUserId,
			'publisherId' => $publisherId
		))->execute();

		return true;
	}
	
	/**
	 * Updates the publisher's avatars, which may have changed with the taintedAccess.
	 * This function should be called during rare events that may cause the
	 * publisher's avatar to change appearance for certain users viewing it.<br/>
	 *
	 * You should rarely have to call this function. It is used internally by the model,
	 * in two main situations:
	 *
	 * 1)  adding, removing or modifying a Streams_Access row for Streams/user/firstName or Streams/user/lastName or Streams/user/gender
	 *	In this case, the function is able to update exactly the avatars that need updating.
	 * 
	 * 2) adding, removing or modifying a Stream row for Streams/user/firstName or Streams/user/lastName or Streams/user/gender
	 *	In this case, there may be some avatars which this function will miss.
	 *	These correspond to users which are reachable by the access array for one stream,
	 *	but not the other. For example, if Streams/user/firstName is being updated, but
	 *	a particular user is reachable only by the access array for Streams/user/lastName, then
	 *	their avatar will not be updated and contain a stale value for firstName.
	 *	To fix this, the Streams_Stream model passes true in the 4th parameter to this function.
	 * @method updateAvatars
	 * @static
	 * @param {string} $publisherId
	 *  id of the publisher whose avatar to update
	 * @param {array} $taintedAccess
	 *  array of Streams_Access objects representing access information that is either
	 *  about to be saved, are about to be overwritten, or will be deleted
	 * @param {string|Streams_Stream} $streamName
	 *  pass the stream name here. You can also pass a Stream_Stream object here,
	 *  in which case it will be used, instead of selecting that stream from the database.
	 * @param {boolean} $updateToPublicValue=false
	 *  if you want to first update all the avatars for this stream
	 *  to the what the public would see, to avoid the situation described in 2).
	 */
	static function updateAvatars(
		$publisherId, 
		$taintedAccess, 
		$streamName, 
		$updateToPublicValue = false)
	{
		if (!isset($streamName)) {
			$streamAccesses = array();
			foreach ($taintedAccess as $access) {
				$streamAccesses[$access->streamName][] = $access;
			}
			if (count($streamAccesses) > 1) {
				foreach ($streamAccesses as $k => $v) {
					Streams_Avatar::update($publisherId, $v, $k);
				}
				return false;
			}
		}
		if ($streamName instanceof Streams_Stream) {
			$stream = $streamName;
			$streamName = $stream->name;
		}

		// If we are here, all the Stream_Access objects have the same streamName
		if ($streamName !== 'Streams/user/firstName'
		and $streamName !== 'Streams/user/lastName'
		and $streamName !== 'Streams/user/username'
		and $streamName !== 'Streams/user/gender') {
			// we don't care about access to other streams being updated
			return false;
		}
		$showToUserIds = array();

		// Select the user corresponding to this publisher
		$user = new Users_User();
		$user->id = $publisherId;
		if (!$user->retrieve(null, null, array('ignoreCache' => true))) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'user',
				'criteria' => 'id = '.$user->id
			));
		}

		// Obtain the stream object to use
		if (isset($stream)) {
			if (!isset($stream->content)) {
				$stream->content = '';
			}
		} else {
			// If the $stream isn't already defined, select it
			$stream = new Streams_Stream();
			$stream->publisherId = $publisherId;
			$stream->name = $streamName;
			if (!$stream->retrieve()) {
				// Strange, this stream doesn't exist.
				// Well, we will just silently set the content to '' then
				$stream->content = '';
			}
		}

		$content_readLevel = Streams::$READ_LEVEL['content'];
		$readLevels = array();
		$label_readLevels = array();
		$contact_label_list = array();
		$removed_labels = array();

		// First, assign all the readLevels that are directly set for specific users,
		// and aggregate the contact_labels from the other accesses, for an upcoming select.
		foreach ($taintedAccess as $access) {
			if ($userId = $access->ofUserId) {
				$readLevel = $access->readLevel;
				$readLevels[$userId] = $readLevel;
				if ($readLevel < 0) {
					$showToUserIds[$userId] = null; // not determined yet
				} else if ($readLevel >= $content_readLevel) {
					$showToUserIds[$userId] = true;
				} else {
					$showToUserIds[$userId] = false;
				}
			} else if ($access->ofContactLabel) {
				$ofContactLabel = $access->ofContactLabel;
				$contact_label_list[] = $ofContactLabel;
				if ($access->get('removed', false)) {
					$removed_labels[$ofContactLabel] = true;
				} else {
					$label_readLevels[$ofContactLabel] = $access->readLevel;
				}
			}
		}

		// Now, get all the people affected by this change, and their readLevels
		$readLevels2 = array();
		if ($contact_label_list) {
			$contact_label_list = array_unique($contact_label_list);
			$contacts = Users_Contact::select()
				->where(array(
					'userId' => $publisherId,
					'label' => $contact_label_list
				))->fetchDbRows(null, '', 'contactUserId');
			foreach ($contacts as $contact) {
				$contactUserId = $contact->contactUserId;
				if (isset($showToUserIds[$contactUserId])) {
					// this user had their read level set directly by the access,
					// which overrides read levels set by access using ofContactLabel
					continue;
				}
				if (isset($removed_labels[$ofContactLabel])) {
					// this label doesn't affect readLevels anymore, since it was deleted
					// but put this contact's id on a list whose readLevels need to be determined
					$showToUserIds[$contactUserId] = null;
					continue;
				}
				if (!isset($label_readLevels[$contact->label])) {
					continue;
				}
				$readLevel = $label_readLevels[$contact->label];
				if (!isset($readLevels2[$contactUserId])) {
					$readLevels2[$contactUserId] = $readLevel;
				} else {
					$readLevels2[$contactUserId] = max(
						$readLevels2[$contactUserId],
						$readLevel
					);
				}
			}
		}

		// Now step through all the users we found who were found through ofContactLabel
		// and make sure we update the avatar rows that were meant for them.
		foreach ($readLevels2 as $userId => $rl) {
			if ($rl >= $content_readLevel) {
				$showToUserIds[$userId] = true;
			} else {
				// in order for this to happen, two things had to be true:
				// 1) there was no access that directly set a readLevel >= $content_readLevel
				// 2) there was no access that set a readLevel >= $content_readLevel for any label containing this user
				// therefore, their view should be the public view
				$showToUserIds[$userId] = 'public';
			}
		}

		// Resolve all the undetermined readLevels
		foreach ($showToUserIds as $userId => $v) {
			if (!isset($v)) {
				// if the readLevel hasn't been determined by now, it's the same as the public one
				$showToUserIds[$userId] = 'public';
			}
		}
		
		// Set up the self avatar:
		$showToUserIds[$publisherId] = true;

		// Finally, set up the public avatar:
		if (!isset($stream->readLevel)) {
			$stream->readLevel = Streams_Stream::$DEFAULTS['readLevel'];
		}
		$showToUserIds[""] = ($stream->readLevel >= $content_readLevel);

		// Now, we update the avatars:
		$parts = explode('/', $streamName);
		$field = end($parts);
		$rows_that_show = array();
		$rows_that_hide = array();
		foreach ($showToUserIds as $userId => $show) {
			if ($show === 'public') {
				// If no show is explicitly specified, use the value used for the rest of the public
				$show = $showToUserIds[""];
			}
			if ($show === true) {
				$rows_that_show[] = array(
					'publisherId' => $publisherId,
					'toUserId' => $userId,
					'username' => $user->username,
					'icon' => $user->icon,
					'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
					$field => $stream->content
				);
			} else if ($show === false) {
				$rows_that_hide[] = array(
					'publisherId' => $publisherId,
					'toUserId' => $userId,
					'username' => $user->username,
					'icon' => $user->icon,
					'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
					$field => ''
				);
			}
		}
		$updates_that_show = array(
			'username' => $user->username,
			'icon' => $user->icon,
			'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
			$field => $stream->content
		);
		$updates_that_hide = array(
			'username' => $user->username,
			'icon' => $user->icon,
			'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
			$field => ''
		);

		// We are now ready to make changes to the database.
		if ($updateToPublicValue) {
			Streams_Avatar::update()
				->set(array($field => $showToUserIds[""] ? $stream->content : ''))
				->where(@compact('publisherId'))
				->execute();
		}
		Streams_Avatar::insertManyAndExecute($rows_that_show, array('onDuplicateKeyUpdate' => $updates_that_show));
		Streams_Avatar::insertManyAndExecute($rows_that_hide, array('onDuplicateKeyUpdate' => $updates_that_hide));
	}
	
	static function streamNames()
	{
		return array(
			'Streams/user/firstName',
			'Streams/user/lastName', 
			'Streams/user/icon', 
			'Streams/user/username', 
			'Streams/user/gender'
		);
	}
	
	/**
	 * Add this avatar to the list of avatars to be preloaded onto the client
	 * with the rest of the page
	 * @method addPreloaded
	 * @static
	 * @param {string} $asUserId=null
	 *	The id of the user from whose point of view the access should be calculated.
	 *  If this matches the publisherId, just sets full access and calls publishedByFetcher(true).
	 *  If this is '', only preloads the streams anybody can see.
	 *  If this is null, the logged-in user's id is used, or '' if no one is logged in
	 */
	function addPreloaded($asUserId=null)
	{
		self::$preloaded["{$this->publisherId}, {$this->toUserId}"] = $this;
	}
	
	/**
	 * Remove this avatars from the list of avatars to be preloaded onto the client
	 * with the rest of the page
	 * @method removePreloaded
	 * @static
	 */
	function removePreloaded()
	{
		unset(self::$preloaded["{$this->publisherId}, {$this->toUserId}"]);
	}

	protected static $cache;
	
	/**
	 * @property $preloaded
	 * @static
	 * @type array
	 */
	static $preloaded = array();

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Avatar} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Avatar();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};