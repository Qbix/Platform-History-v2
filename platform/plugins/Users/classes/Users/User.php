<?php
/**
 * @module Users
 */
/**
 * Class representing 'User' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a user row in the Users database.
 *
 * @class Users_User
 * @extends Base_Users_User
 */
class Users_User extends Base_Users_User
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
	 * Intelligently retrieves user by id
	 * @method fetch
	 * @static
	 * @param {string} $userId
	 * @param {boolean} [$throwIfMissing=false] If true, throws an exception if the user can't be fetched
	 * @return {Users_User|null|array} If $userId is an array, returns an array of ($userId => $user) pairs.
	 *   Otherwise returns a Users_User object, or null.
	 * @throws {Users_Exception_NoSuchUser} if the user wasn't found in the database
	 */
	static function fetch ($userId, $throwIfMissing = false)
	{
		if (is_array($userId)) {
			$users = Users_User::select()
				->where(array('id' => $userId))
				->fetchDbRows(null, '', 'id');
			if ($throwIfMissing) {
				foreach ($userId as $xid) {
					if (!isset($users[$xid])) {
						$missing[] = $xid;
					}
				}
				if ($missing) {
					throw new Q_Exception("Missing users with ids " . implode(', ', $missing));
				}
			}
			return $users;
		}
		if (empty($userId)) {
			$result = null;
		} else if (!empty(self::$cache['getUser'][$userId])) {
			$result = self::$cache['getUser'][$userId];
		} else {
			$user = new Users_User();
			$user->id = $userId;
			if (!$user->retrieve()) {
				$user = null;
			}
			self::$cache['getUser'][$userId] = $user;
		 	$result = $user;
		}
		if (!$result and $throwIfMissing) {
			throw new Users_Exception_NoSuchUser();
		}
		return $result;
	}
	
	/**
	 * Get the url of the user's icon
	 * @param {string|false} [$basename=null] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
	 * @return {string} The stream's icon url
	 */
	function iconUrl($basename = null)
	{
		$replacements = array(
			'userId' => Q_Utils::splitId($this->id)
		);
		return Users::iconUrl(
			isset($this->icon) ? Q::interpolate($this->icon, $replacements) : 'default', 
			$basename
		);
	}

	/**
	 * Returns the fields and values we can export to clients.
	 * Can also contain "messageTotals", "relatedToTotals" and "relatedFromTotals".
	 * @method exportArray
	 * @param {$array} [$options=null] can include the following:
	 * @param {string} [$options.asAvatar] set to true if only the avatar fields should be exported
	 * @return {array}
	 */
	function exportArray($options = null)
	{
		$fields = empty($options['asAvatar'])
			? Q_Config::expect('Users', 'exportFields')
			: Q_Config::expect('Users', 'avatarFields');
		$u = array();
		foreach ($fields as $field) {
			if (isset($this->$field)) {
				$u[$field] = $this->$field;
			}
		}
		if (isset($u['xids'])) {
			$u['xids'] = $this->getAllXids();
		}
		return $u;
	}
	
	/**
	 * Add this user to the list of user objects to be preloaded onto the client with the rest of the page
	 * @method addPreloaded
	 */
	function addPreloaded()
	{
		self::$preloaded[$this->id] = $this;
	}
	
	/**
	 * Remove this user from the list of user objects to be preloaded onto the client with the rest of the page
	 * @method addPreloaded
	 */
	function removePreloaded()
	{
		unset(self::$preloaded[$this->id]);
	}
	
	/**
	 * Use this function to display the name of a user
	 * @param {array} $options to pass to any hooks
	 */
	function displayName($options = array())
	{
		$user = $this;
 		$name = Q::event('Users/User/displayName', @compact('user', 'options'), 'before');
		return isset($name) ? $name : $this->username;
	}

	/**
	 * Checks whether user belong to developers group
	 */
	function isDeveloper () {
		$user = $this;
		$developers = Q_Config::get("Users", "developers", array());

		if (in_array($user->emailAddress, $developers) || in_array($user->mobileNumber, $developers)) {
			return true;
		}

		return false;
	}

	/**
	 * Call this to prepare the passphrase before passing it to
	 * $user->hashPassphrase() and $user->verifyPassphrase()
	 * @param {array} $passphrase The value to be checked depends on value of isHashed.
	 * @param {integer} $isHashed You can pass 0 if this is actually the passphrase,
	 *   1 if it has been hashed using sha1("$realPassphrase\t$userId")
	 */
	function preparePassphrase($passphrase, $isHashed)
	{
		if ($result = Q::event("Users/preparePassphraseHash", @compact(
			'passphrase', 'isHashed', 'user'), 'before'
		)) {
			return $result;
		}
		if (!$isHashed and $passphrase) {
			$passphrase = sha1($passphrase . "\t" . $this->salt);
		}
		return $passphrase;
	}

	/**
	 * Hashes a passphrase for this user
	 * @method hashPassphrase
	 * @param {string} $passphrase the passphrase to hash
	 * @param {string} [$algorithm='password_hash'] Can be 'hash_pbkdf2'
	 * @return {string} the hashed passphrase, or "" if the passphrase was ""
	 */
	function hashPassphrase ($passphrase, $algorithm = 'password_hash', $options = array())
	{
		if ($passphrase === '') {
			return '';
		}
		if ($algorithm === 'hash_pbkdf2') {
			$iterations = Q::ifset($options, 'iterations', 64000);
			return hash_pbkdf2('sha256', $passphrase, $this->salt, $iterations, 64, false);
		}
		return password_hash($passphrase, PASSWORD_DEFAULT);

		// $hash_function = Q_Config::get(
		// 	'Users', 'passphrase', 'hashFunction', 'sha1'
		// );
		// $passphraseHash_iterations = Q_Config::get(
		// 	'Users', 'passphrase', 'hashIterations', 1103
		// );
		// $salt_length = Q_Config::set('Users', 'passphrase', 'saltLength', 0);
		//
		// if ($salt_length > 0) {
		// 	if (empty($existing_hash)) {
		// 		$salt = substr(sha1(uniqid(mt_rand(), true)), 0,
		// 			$salt_length);
		// 	} else {
		// 		$salt = substr($existing_hash, - $salt_length);
		// 	}
		// }
		//
		// $salt2 = isset($salt) ? '_'.$salt : '';
		// $result = $passphrase;
		//
		// // custom hash function
		// if (!is_callable($hash_function)) {
		// 	throw new Q_Exception_MissingFunction(array(
		// 		'function_name' => $hash_function
		// 	));
		// }
		// $confounder = $passphrase . $salt2;
		// $confounder_len = strlen($confounder);
		// for ($i = 0; $i < $passphraseHash_iterations; ++$i) {
		// 	$result = call_user_func(
		// 		$hash_function,
		// 		$result . $confounder[$i % $confounder_len]
		// 	);
		// }
		// $result .= $salt2;
		//
		// return $result;
	}

	/**
	 * Verifies a passphrase against a hash generated previously
	 * @method verifyPassphrase
* @param {string} $existingHash the hash that is was previously generated
	 * @param {string} $passphrase the passphrase to hash
	 * @param {boolean} $isHashed whether the passphrase was already hashed on the client
	 * @return {boolean} whether the password is verified to be correct, or not
	 */
	function verifyPassphrase ($existingHash, $passphrase, $isHashed)
	{
		if (empty($existingHash)) {
			return false;
		}
		// Try using various algorithms
		$algorithms = Q_Config::expect('Users', 'passphrase', 'algorithms');
		foreach ($algorithms as $algorithm => $options) {
			if ($algorithm === 'password_hash') {
				$p = $isHashed ? $passphrase : sha1($passphrase . "\t" . $this->salt);
				if ($existingHash[0] === '$'
				and password_verify($p, $existingHash)) {
					return true;
				}
			} else if ($algorithm === 'hash_pbkdf2') {
				if ($isHashed) {
					return false; // TODO: support doing some iterations on the client in JS first
				}
				$iterations = Q::ifset($options, 'iterations', 64000);
				if ($existingHash === hash_pbkdf2('sha256', $passphrase, $this->salt, $iterations, 64, false)) {
					return true;
				}
			}
		}
		return false;
	}
	
	/**
	 * @method beforeSet_username
	 * @param {string} $username
	 * @return {array}
	 */
	function beforeSet_username($username)
	{
		parent::beforeSet_username($username);
		if (!isset($username)) {
			return array('username', $username);
		}

		/**
		 * @event Users/validate/username
		 * @param {&string} username
		 */
		Q::event(
			'Users/validate/username',
			array('username' => & $username, 'user' => $this)
		);
		return array('username', $username);
	}
	
	/**
	 * @method beforeSet_emailAddress
	 * @param {string} $emailAddress
	 * @return {array}
	 */
	function beforeSet_emailAddress($emailAddress)
	{
		parent::beforeSet_emailAddress($emailAddress);
		/**
		 * @event Users/validate/emailAddress
		 * @param {&string} emailAddress
		 */
		Q::event(
			'Users/validate/emailAddress',
			array('emailAddress' => & $emailAddress)
		);
		if (!isset($emailAddress)) {
			return array('emailAddress', $emailAddress);
		}
		return array('emailAddress', $emailAddress);
	}
	
	/**
	 * @method idFilter
	 * @param {string} $params
	 * @return {boolean}
	 */
	static function idFilter($params)
	{
		/**
		 * @event Users/filter/id
		 * @param {string} id
		 * @return {boolean}
		 */
		return Q::event('Users/filter/id', $params);
	}
	
	/**
	 * Assigns 'id' and verifies 'username' fields
	 * @method beforeSave
	 * @param {array} $updatedFields
	 * @return {array}
	 * @throws {Users_Exception_UsernameExists}
	 *	If username already exists
	 */
	function beforeSave($updatedFields)
	{
		if (!$this->retrieved) {
			if (!isset($updatedFields['id'])) {
				$this->id = $updatedFields['id'] = 
				self::db()->uniqueId(self::table(), 'id', null, array(
					'filter' => array('Users_User', 'idFilter')
				));
			}
			if (!isset($updatedFields['salt'])) {
				$this->salt = $updatedFields['salt'] = Q_Utils::randomHexString(32);
			}
			if (!isset($updatedFields['username'])) {
				// put an empty username for now
				$this->username = $updatedFields['username'] = '';
			}
			if (empty($updatedFields['icon'])) {
				$this->icon = $updatedFields['icon'] = '{{Users}}/img/icons/default';
			}
		} else if (isset($updatedFields['icon']) and !$updatedFields['icon']) {
			$this->icon = $updatedFields['icon'] = '{{Users}}/img/icons/default';
		}

		if (!empty($updatedFields['username'])) {
			$app = Q::app();
			$unique = Q_Config::get('Users', 'model', $app, 'uniqueUsername', true);
			$username = $updatedFields['username'];
			$criteria = @compact('username');
			if (isset($this->id)) {
				$criteria['id != '] = $this->id;
			}
			$usernamePrev = Q::ifset($this->fieldsOriginal, 'username', null);
			if ($usernamePrev !== $username) {
				if ($username) {
					$username_hashed = Q_Utils::hash(Q_Utils::normalize($username));
					$ui = new Users_Identify();
					$ui->identifier = "username_hashed:$username_hashed";
					if ($ui->retrieve()) {
						if ($ui->userId !== $this->id) {
							throw new Users_Exception_UsernameExists($criteria, 'username');
						}
					} else {
						$username_hashed = Q_Utils::hash(Q_Utils::normalize($username));
						$ui = new Users_Identify();
						$ui->identifier = "username_hashed:$username_hashed";
						$ui->state = 'verified';
						$ui->userId = $this->id;
						$ui->save(true);
					}
				}
				if ($usernamePrev) {
					$usernamePrev_hashed = Q_Utils::hash(Q_Utils::normalize($usernamePrev));
					if ($usernamePrev_hashed != $username_hashed) {
						$uiPrev = new Users_Identify();
						$uiPrev->identifier = "username_hashed:$usernamePrev_hashed";
						$uiPrev->remove();
					}
				}
			}
		}
		$user = $this;
		Q::event(
			'Users/User/save', 
			@compact('user', 'updatedFields'),
			'before'
		);
		return parent::beforeSave($updatedFields);
	}
	
	function afterSaveExecute($result, $query, $modifiedFields, $where, $inserted)
	{
		$user = $this;
		if ($inserted) {
			if (Users::isCommunityId($user->id)) {
				if ($roles = Q_Config::get('Users', 'onInsert', 'roles', array())) {
					Users_Label::addLabel($roles, $this->id, null, null, false, true);
				}
			} else {
				if ($labels = Q_Config::get('Users', 'onInsert', 'labels', array())) {
					Users_Label::addLabel($labels, $this->id, null, null, false, true);
				}
			}
		}
		Q::event(
			'Users/User/save', 
			@compact('user', 'result', 'query', 'modifiedFields', 'where'),
			'after'
		);
		return $result;
	}
	
	/**
	 * Add a contact label
	 * @method {boolean} addLabel
	 * @param {string|array} $label the label or array of ($label => array($title, $icon))
	 * @param {string} [$title=''] specify the title, otherwise a default one is generated
	 * @param {string} [$icon='default']
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @return {Users_Label}
	 */
	function addLabel($label, $title='', $icon='default', $asUserId = null)
	{
		Users_Label::addLabel($label, $this->id, $title, $icon, $asUserId);
	}
	
	/**
	 * Update labels
	 * @method updateLabel
	 * @param {string} $label
	 * @param {array} $updates Can contain one or more of "title", "icon"
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @throws {Users_Exception_NotAuthorized}
	 * @return {Db_Query_Mysql}
	 */
	function updateLabel($label, $updates, $asUserId = null)
	{
		Users_Label::updateLabel($label, $updates, $this->id, $asUserId);
	}
	
	/**
	 * Remove label
	 * @method removeLabel
	 * @param {string} $label
	 * @param {string|null} [$userId=null]
	 *  The user whose label is to be removed
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @return {Db_Query_MySql}
	 */
	static function removeLabel($label, $userId = null, $asUserId = null)
	{
		Users_Label::removeLabel($label, $userId, $asUserId);
	}
	
	/**
	 * @method addContact
	 * @param {string} $contactUserId
	 *  The id of the user who is the contact
	 * @param {string|array} $label
	 *  The label of the contact. This can be a string or an array of strings, in which case
	 *  multiple contact rows are saved.
	 * @param {string} [$nickname='']
	 *  Optional nickname to assign to the contact
	 *  @optional
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @throws {Q_Exception_RequiredField}
	 *	if $label is missing
	 * @return {array} Array of contacts that are saved
	 */
	function addContact($label, $contactUserId, $nickname = '', $asUserId = null)
	{
		Users_Contact::addContact($this->id, $label, $contactUserId, $nickname, $asUserId);
	}
	
	/**
	 * Update a particular contact with a given userId, label, contactId.
	 * @method updateContact
	 * @static
	 * @param {string} $label
	 * @param {string} $contactUserId
	 * @param {array} $updates should be an array with only one key: "nickname"
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @throws {Users_Exception_NotAuthorized}
	 * @return {Db_Query_Mysql}
	 */
	function updateContact($label, $contactUserId, $updates, $asUserId = null)
	{
		Users_Contact::updateContact($this->id, $label, $contactUserId, $updates, $asUserId);
	}
	
	/**
	 * @method removeContact
	 * @param {string|array} $label
	 *  The label of the contact. 
	 * @param {string} $contactUserId
	 *  The id of the user who is the contact
	 * @param {string} [$asUserId=null]
	 *  The id of the user who is the contact
	 * @return {Db_Mysql}
	 */
	function removeContact($label, $contactUserId, $asUserId = null)
	{
		Users_Contact::removeContact($this->id, $label, $contactUserId, $asUserId);
	}
	
	/**
	 * Starts the process of adding an email to a saved user object.
	 * Also modifies and saves this user object back to the database.
	 * @method addEmail
	 * @param {string} $emailAddress
	 *  The email address to add.
	 * @param {string|array} [$activationEmailSubject=null]
	 *  The subject of the activation email to send.
	 *  You can also pass an array($source, array($key1, $key2)) to use Q_Text.
	 * @param {string} [$activationEmailView=null]
	 *  The view to use for the body of the activation email to send.
	 * @param {boolean} [$html=true]
	 *  Defaults to true. Whether to send as HTML email.
	 * @param {array} [$fields=array()]
	 *  An array of additional fields to pass to the email view.
	 * @param {array} [$options=array()] Array of options. Can include:
	 * @param {string} [$options.html=false] Whether to send as HTML email.<br/>
	 * @param {string} [$options.name] A human-readable name in addition to the address.
	 * @param {string} [$options.from] An array of (emailAddress, human_readable_name)
	 * @param {string} [$options.delay] A delay, in milliseconds, to wait until sending email. Only works if Node server is listening.
	 * @param {string} [$options.activation] The key under "Users"/"transactional" config to use for getting activation messages by default. Set to false to skip sending the activation message for some reason.
	 * @param {string} [$options.redirect] The URL to redirect to after activation is completed
	 * @param {Users_Email} [&$email] Optional reference to be filled
	 * @return {boolean}
	 *  Returns true on success.
	 *  Returns false if this email address is already verified for this user.
	 * @throws {Q_Exception_WrongValue}
	 *  If the email address is in an invalid format, this is thrown.
	 * @throws {Users_Exception_AlreadyVerified}
	 *  If the email address already exists and has been verified for
	 *  another user, then this exception is thrown.
	 */
	function addEmail(
		$emailAddress,
		$activationEmailSubject = null,
		$activationEmailView = null,
		array $fields = array(),
		array $options = array(),
		&$email = null)
	{
		if (!isset($options['html'])) {
			$options['html'] = true;
		}
		if (!Q_Valid::email($emailAddress, $normalized)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'Email', 
				'range' => 'a valid address'
			), 'emailAddress');
		}
		$email = new Users_Email();
		$email->address = $normalized;
		if ($email->retrieve(null, array('ignoreCache' => true))
		and $email->state !== 'unverified') {
			if ($email->userId === $this->id) {
				$email->set('user', $this);
				$this->setEmailAddress($emailAddress, true);
				return $email;
			}
			// Otherwise, say it's verified for another user,
			// even if it unsubscribed or was suspended.
			throw new Users_Exception_AlreadyVerified(array(
				'key' => 'email address',
				'userId' => $email->userId
			), 'emailAddress');
		}
		
		$user = $this;
		
		// If we are here, then the email record either
		// doesn't exist, or hasn't been verified yet.
		// In either event, update the record in the database,
		// and re-send the email.
		$minutes = Q_Config::get('Users', 'activation', 'expires', 60*24*7);
		$email->state = 'unverified';
		$email->userId = $this->id;
		$email->activationCode = strtolower(Q_Utils::randomString(7));
		$email->activationCodeExpires = new Db_Expression(
			"CURRENT_TIMESTAMP + INTERVAL $minutes MINUTE"
		);
		$email->authCode = sha1(microtime() . mt_rand());
		$arr = array(
			'code' => $email->activationCode,
			'e' => $email->address
		);
		if (!empty($options['redirect'])) {
			$arr['redirect'] = $options['redirect'];
		}
		$querystring = http_build_query($arr);
		$link = Q_Uri::url("Users/activate?$querystring");
		Users::$cache['Users/activate link'] = $link;
		$unsubscribe = Q_Uri::url('Users/unsubscribe?' . http_build_query(array(
			'authCode' =>  $email->authCode, 
			'e' => $email->address
		)));
		$communityName = Users::communityName();
		$communitySuffix = Users::communitySuffix();
		/**
		 * @event Users/addIdentifier {before}
		 * @param {string} user
		 * @param {string} email
		 */
		Q::event('Users/addIdentifier', @compact('user', 'email', 'link', 'unsubscribe'), 'before');
		$email->save();
		
		$this->emailAddressPending = $normalized;
		$this->save();
		
		if ($activation = Q::ifset($options, 'activation', 'activation')) {
			if (!isset($activationEmailView)) {
				$activationEmailView = Q_Config::get(
					'Users', 'transactional', $activation, 'body', 'Users/email/activation.php'
				);
			}
			if (!isset($activationEmailSubject)) {
				$activationEmailSubject = Q_Config::get(
					'Users', 'transactional', $activation, 'subject', 
					"Welcome! Please confirm your email address." 
				);
			}
			$baseUrl = Q_Request::baseUrl();
			$fields2 = array_merge($fields, array(
				'user' => $this,
				'email' => $email,
				'app' => Q::app(),
				'communityName' => $communityName,
				'communitySuffix' => $communitySuffix,
				'baseUrl' => Q_Request::baseUrl(),
				'link' => $link,
				'code' => $email->activationCode,
				'domain' => parse_url($baseUrl, PHP_URL_HOST),
				'unsubscribe' => $unsubscribe
			));
			$email->sendMessage(
				$activationEmailSubject, 
				$activationEmailView, 
				$fields2,
				$options
			); // may throw exception if badly configured
		}
		
		/**
		 * @event Users/addIdentifier {after}
		 * @param {string} user
		 * @param {string} email
		 */
		Q::event('Users/addIdentifier', @compact('user', 'email', 'link'), 'after');
	}
	
	/**
	 * @method setEmailAddress
	 * @param {string} $emailAddress
	 * @param {boolean} [$verified=false]
	 *  Whether to force the email address to be marked verified for this user,
	 *  even if it was verified for someone else or wasn't even saved in the database.
	 * @param {Users_Email} [&$email] Optional reference to be filled
	 * @throws {Q_Exception_MissingRow}
	 *	If e-mail address is missing
	 * @throws {Users_Exception_AlreadyVerified}
	 *	If user is already verified
	 * @throws {Users_Exception_WrongState}
	 *	If verification state is wrong
	 */
	function setEmailAddress($emailAddress, $verified = false, &$email = null)
	{
		$email = new Users_Email();
		Q_Valid::email($emailAddress, $normalized);
		$email->address = $normalized;
		$retrieved = $email->retrieve(null, array('ignoreCache' => true));
		if (empty($email->activationCode)) {
			$email->activationCode = '';
			$email->activationCodeExpires = null;
		}
		$email->authCode = sha1(microtime() . mt_rand());
		if (!$verified) {
			if (!$retrieved) {
				throw new Q_Exception_MissingRow(array(
					'table' => "an email",
					'criteria' => "address $emailAddress"
				), 'emailAddress');
			}
			if ($email->userId != $this->id) {
				// We're going to tell them it's verified for someone else,
				// even though it may not have been verified yet.
				// In the future, might throw a more accurate exception.
				throw new Users_Exception_AlreadyVerified(array(
					'key' => 'email address',
					'userId' => $email->userId
				));
			}
			if (!in_array($email->state, array('unverified', 'active'))) {
				throw new Users_Exception_WrongState(array(
					'key' => $email->address,
					'state' => $email->state
				), 'emailAddress');
			}
		}

		// Everything is okay. Assign it!
		$email->userId = $this->id;
		$email->state = 'active';
		$email->save();
		
		$ui = new Users_Identify();
		$ui->identifier = "email_hashed:".Q_Utils::hash($normalized);
		$ui->state = 'verified';
		$ui->userId = $this->id;
		$ui->save(true);

		$this->emailAddressPending = '';
		$this->emailAddress = $emailAddress;
		$this->save();
		$user = $this;
		
		Q_Response::removeNotice('Users/email');
		
		/**
		 * @event Users/setEmailAddress {after}
		 * @param {string} user
		 * @param {string} email
		 */
		Q::event('Users/setEmailAddress', @compact('user', 'email'), 'after');
		return true;
	}

	/**
	 * @method removeEmail
	 * @param {string} $emailAddress
	 * @throws Q_Exception_WrongValue
	 * @throws Q_Exception_MissingRow
	 * @return bool
	 */
	function removeEmail($emailAddress)
	{
		// check if email activated by user
		if (!Q_Valid::email($emailAddress, $normalized)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'email',
				'range' => 'a valid email address'
			), 'mobileNumber');
		}
		$users_email = new Users_Email();
		$users_email->address = $normalized;
		$users_email->userId = $this->id;
		$retrieved = $users_email->retrieve(null, array('ignoreCache' => true));
		if (!$retrieved) {
			throw new Q_Exception_MissingRow(array(
				'table' => "an email",
				'criteria' => "address $emailAddress"
			), 'emailAddress');
		}

		$users_email->remove();

		if ($this->emailAddress == $normalized) {
			$this->emailAddress = '';
			$this->save();
		}

		Q_Response::removeNotice('Users/email');

		return true;
	}
	/**
	 * @method removeMobile
	 * @param {string} $mobileNumber
	 * @throws Q_Exception_MissingRow
	 * @throws Q_Exception_WrongValue
	 * @return bool
	 */
	function removeMobile($mobileNumber)
	{
		// check if email activated by user
		if (!Q_Valid::phone($mobileNumber, $normalized)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'Mobile phone',
				'range' => 'a valid number'
			), 'mobileNumber');
		}
		$users_mobile = new Users_Mobile();
		$users_mobile->number = $normalized;
		$users_mobile->userId = $this->id;
		$retrieved = $users_mobile->retrieve(null, array('ignoreCache' => true));
		if (!$retrieved) {
			throw new Q_Exception_MissingRow(array(
				'table' => "an mobile",
				'criteria' => "number $mobileNumber"
			), 'emailAddress');
		}

		$users_mobile->remove();

		if ($this->mobileNumber == $normalized) {
			$this->mobileNumber = '';
			$this->save();
		}

		Q_Response::removeNotice('Users/mobile');

		return true;
	}
	/**
	 * @method removeIdentifier
	 * @param {string} $identifier
	 * @throws Users_Exception_LastIdentifier
	 * @return {boolean} whether something was removed
	 */
	function removeIdentifier($identifier)
	{
		$identifierType = Users::identifierType($identifier, $normalized);

		if ($identifierType == 'email') {
			$this->removeEmail($identifier);
			return true;
		}
		if ($identifierType == 'mobile') {
			$this->removeMobile($identifier);
			return true;
		}

		return false;
	}
	/**
	 * Starts the process of adding a mobile to a saved user object.
	 * Also modifies and saves this user object back to the database.
	 * @method addMobile
	 * @param {string} $mobileNumber
	 *  The mobile number to add.
	 * @param {string} [$activationMessageView=null]
	 *  The view to use for the body of the activation message to send.
	 * @param {array} [$fields=array()]
	 *  An array of additional fields to pass to the mobile view.
	 * @param {array} [$options=array()] Array of options. Can include:
	 * @param {string} [$options.delay] A delay, in milliseconds, to wait until sending email. Only works if Node server is listening.
	 * @param {string} [$options.activation] The key under "Users"/"transactional" config to use for getting activation messages by default. Set to false to skip sending the activation message for some reason.
	 * @param {string} [$options.redirect] The URL to redirect to after activation is completed
	 * @param {Users_Mobile} [&$mobile] Optional reference to be filled
	 * @return {boolean}
	 *  Returns true on success.
	 *  Returns false if this mobile number is already verified for this user.
	 * @throws {Q_Exception_WrongValue}
	 *  If the mobile number is in an invalid format, this is thrown.
	 * @throws {Users_Exception_AlreadyVerified}
	 *  If the mobile number already exists and has been verified for
	 *  another user, then this exception is thrown.
	 */
	function addMobile(
		$mobileNumber,
		$activationMessageView = null,
		array $fields = array(),
		array $options = array(),
		&$mobile = null)
	{
		if (!Q_Valid::phone($mobileNumber, $normalized)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'Mobile phone', 
				'range' => 'a valid number'
			), 'mobileNumber');
		}
		$mobile = new Users_Mobile();
		$mobile->number = $normalized;
		if ($mobile->retrieve(null, array('ignoreCache' => true))
		and $mobile->state !== 'unverified') {
			if ($mobile->userId === $this->id) {
				$mobile->set('user', $this);
				$this->setMobileNumber($mobileNumber);
				return $mobile;
			}
			// Otherwise, say it's verified for another user,
			// even if it unsubscribed or was suspended.
			throw new Users_Exception_AlreadyVerified(array(
				'key' => 'mobile number',
				'userId' => $mobile->userId
			), 'mobileNumber');
		}
		
		$user = $this;
		
		// If we are here, then the mobile record either
		// doesn't exist, or hasn't been verified yet.
		// In either event, update the record in the database,
		// and re-send the mobile.
		$minutes = Q_Config::get('Users', 'activation', 'expires', 60*24*7);
		$mobile->state = 'unverified';
		$mobile->userId = $this->id;
		$mobile->activationCode = strtolower(Q_Utils::randomString(7));
		$mobile->activationCodeExpires = new Db_Expression(
			"CURRENT_TIMESTAMP + INTERVAL $minutes MINUTE"
		);
		$number = $mobile->number;
		if (substr($number, 0, 2) == '+1') {
			$number = substr($number, 2);
		}
		$mobile->authCode = sha1(microtime() . mt_rand());
		$arr = array(
			'code' => $mobile->activationCode,
			'm' => $number
		);
		if (!empty($options['redirect'])) {
			$arr['redirect'] = $options['redirect'];
		}
		$querystring = http_build_query($arr);
		$link = Q_Uri::url("Users/activate?$querystring");
		Users::$cache['Users/activate link'] = $link;
		$unsubscribe = Q_Uri::url('Users/unsubscribe?' . http_build_query(array(
			'authCode' =>  $mobile->authCode, 
			'm' => $mobile->number
		)));
		$communityName = Users::communityName();
		$communitySuffix = Users::communitySuffix();
		/**
		 * @event Users/addIdentifier {before}
		 * @param {string} user
		 * @param {string} mobile
		 */
		Q::event('Users/addIdentifier', @compact('user', 'mobile', 'link'), 'before');
		$mobile->save();
		
		$this->mobileNumberPending = $normalized;
		$this->save();
		
		if ($activation = Q::ifset($options, 'activation', 'activation')) {
			if (!isset($activationMessageView)) {
				$activationMessageView = Q_Config::get(
					'Users', 'transactional', $activation, 'sms', 'Users/sms/activation.php'
				);
			}
			$baseUrl = Q_Request::baseUrl();
			$fields2 = array_merge($fields, array(
				'user' => $this,
				'mobile' => $mobile,
				'app' => Q::app(),
				'communityName' => $communityName,
				'communitySuffix' => $communitySuffix,
				'baseUrl' => $baseUrl,
				'code' => $mobile->activationCode,
				'domain' => parse_url($baseUrl, PHP_URL_HOST),
				'link' => $link
			));
			$mobile->sendMessage(
				$activationMessageView, 
				$fields2,
				$options
			);
		}
		
		Q_Response::removeNotice('Users/mobile');
		
		/**
		 * @event Users/addIdentifier {after}
		 * @param {string} user
		 * @param {string} mobile
		 */
		Q::event('Users/addIdentifier', @compact('user', 'mobile', 'link'), 'after');
	}
	
	/**
	 * @method setMobileNumber
	 * @param {string} $mobileNumber
	 * @param {boolean} [$verified=false]
	 *  Whether to force the mobile number to be marked verified for this user,
	 *  even if it was verified for someone else or wasn't even saved in the database.
	 * @param {Users_Mobile} [&$mobile] Optional reference to be filled
	 * @throws {Q_Exception_MissingRow}
	 *	If mobile number is missing
	 * @throws {Users_Exception_AlreadyVerified}
	 *	If user was already verified
	 * @throws {Users_Exception_WrongState}
	 *	If verification state is wrong
	 */
	function setMobileNumber($mobileNumber, $verified = false, &$mobile = null)
	{
		Q_Valid::phone($mobileNumber, $normalized);
		$mobile = new Users_Mobile();
		$mobile->number = $normalized;
		$retrieved = $mobile->retrieve(null, array('ignoreCache' => true));
		if (empty($mobile->activationCode)) {
			$mobile->activationCode = '';
			$mobile->activationCodeExpires = null;
		}
		$mobile->authCode = sha1(microtime() . mt_rand());
		if (!$verified) {
			if (!$retrieved) {
				throw new Q_Exception_MissingRow(array(
					'table' => "a mobile phone",
					'criteria' => "number $normalized"
				), 'mobileNumber');
			}
			if ($retrieved and $mobile->userId != $this->id) {
				// We're going to tell them it's verified for someone else,
				// even though it may not have been verified yet.
				// In the future, might throw a more accurate exception.
				throw new Users_Exception_AlreadyVerified(array(
					'key' => 'mobile number',
					'userId' => $mobile->userId
				));
			}
			if (!in_array($mobile->state, array('unverified', 'active'))) {
				throw new Users_Exception_WrongState(array(
					'key' => $mobile->number,
					'state' => $mobile->state
				), 'mobileNumber');
			}
		}

		// Everything is okay. Assign it!
		$mobile->userId = $this->id;
		$mobile->state = 'active';
		$mobile->save();
		
		$ui = new Users_Identify();
		$ui->identifier = "mobile_hashed:".Q_Utils::hash($normalized);
		$ui->state = 'verified';
		$ui->userId = $this->id;
		$ui->save(true);
		
		$this->mobileNumberPending = '';
		$this->mobileNumber = $normalized;
		$this->save();
		$user = $this;
		/**
		 * @event Users/setMobileNumber {after}
		 * @param {string} user
		 * @param {string} mobile
		 */
		Q::event('Users/setMobileNumber', @compact('user', 'mobile'), 'after');
		return true;
	}
	
	/**
	 * Sets the user as verified without any further ado.
	 * Can be used e.g. after following an invitation link
	 * May download the gravatar icon for the user.
	 * To log in using another session, the user would be asked to set up
	 * a passphrase.
	 * @return {boolean} whether the user was successfully set as verified
	 */
	function setVerified()
	{
		$identifier = null;
		if ($this->signedUpWith === 'none') {
			if (!empty($this->emailAddressPending)) {
				// invite must have been sent to email address
				$identifier = $this->emailAddressPending;
				$this->emailAddressPending = '';
				$this->signedUpWith = 'email';
			} else if (!empty($this->mobileNumberPending)) {
				// invite must have been sent to mobile number
				$identifier = $this->mobileNumberPending;
				$this->mobileNumberPending = '';
				$this->signedUpWith = 'mobile';
			}
		}
		if (empty($identifier)) return false;
		if (Q_Valid::email($identifier, $emailAddress)) {
			$this->setEmailAddress($emailAddress, true);
		} else if (Q_Valid::phone($identifier, $mobileNumber)) {
			$this->setMobileNumber($mobileNumber, true);
		} else {
			throw new Q_Exception_WrongType(array(
				'field' => 'identifier',
				'type' => 'email address or mobile number'
			), array('emailAddress', 'mobileNumber'));
		}
		// Import the user's icon and save it
		if (empty($this->icon)
		or Q::startsWith($this->icon, 'default')
		or Q::startsWith($this->icon, 'future')) {
			// Download icon from gravatar or another service
			$hash = md5(strtolower(trim($identifier)));
			$icon = array(
				'40.png' => array('hash' => $hash, 'size' => 40),
				'50.png' => array('hash' => $hash, 'size' => 50),
				'80.png' => array('hash' => $hash, 'size' => 80)
			);
			$app = Q::app();
			$directory = APP_FILES_DIR.DS.$app.DS.'uploads'.DS.'Users'
				.DS.Q_Utils::splitId($this->id).DS.'icon'.DS.'generated';
			Users::importIcon($this, $icon, $directory);
		}
		return true;
	}

	/**
	 * Get the Users_Email object corresponding to this user's email address, if any
	 * @method email
	 * @return Users_Email
	 */
	function email()
	{
		if ($this->emailAddress) {
			return null;
		}
		$email = new Users_Email();
		$email->address = $this->emailAddress;
		return $email->retrieve();
	}

	/**
	 * Get the Users_Mobile object corresponding to this user's email address, if any
	 * @method mobile
	 * @return Users_Mobile
	 */
	function mobile()
	{
		if ($this->mobileNumber) {
			return null;
		}
		$mobile = new Users_Mobile();
		$mobile->number = $this->mobileNumber;
		return $mobile->retrieve();
	}
	
	/**
	 * @method getAllXids
	 * @return {array} An array of ($platform => $xid) pairs
	 */
	function getAllXids()
	{
		return empty($this->xids) 
			? array()
			: json_decode($this->xids, true);
	}
	
	/**
	 * @method getXid
	 * @param {string} $platformApp String of the form $platform."_".$appId
	 * @param {string|null} $default The value to return if the xid is missing
	 * @return {string|null} The value of the xid, or the default value, or null
	 */
	function getXid($platformApp, $default = null)
	{
		$xids = $this->getAllXids();
		if (isset($xids[$platformApp])) {
			return $xids[$platformApp];
		}
		$platformApp2 = str_replace("_", "\t", $platformApp);
		if (isset($xids[$platformApp2])) {
			return $xids[$platformApp2];
		}
		return $default;
	}
	
	/**
	 * @method setXid
	 * @param {string|array} $platformApp String of the form $platform."_".$appId
	 *  or an array of $platformApp => $xid pairs
	 * @param {string} $xid The value to set the xid to
	 */
	function setXid($platformApp, $xid = null)
	{
		$xids = $this->getAllXids();
		if (is_array($platformApp)) {
			foreach ($platformApp as $k => $v) {
				$xids[$k] = $v;
			}
		} else {
			$xids[$platformApp] = $xid;
		}
		$this->xids = Q::json_encode($xids);
	}
	
	/**
	 * @method clearXid
	 * @param {string} $platform String of the form "$platform_$appId"
	 */
	function clearXid($platformApp)
	{
		$xids = $this->getAllXids();
		unset($xids[$platformApp]);
		$this->xids = Q::json_encode($xids);
	}
	
	/**
	 * @method clearAllXids
	 */
	function clearAllXids()
	{
		$this->xids = '{}';
	}
	
	/**
	 * get user id
	 * @method _getId
	 * @static
	 * @private
	 * @param {Users_User} $u
	 * @return {string}
	 */
	private static function _getId ($u) {
		return isset($u) && isset($u->id) ? $u->id : null;
	}
	
	/**
	 * Check label or array of labels and return existing users
	 * @method labelsToIds
	 * @static
	 * @param $asUserId {string} The user id of inviting user
	 * @param $labels {string|array}
	 * @return {array} The array of user ids
	 */
	static function labelsToIds ($asUserId, $labels)
	{
		if (empty($labels)) {
			return array();
		}
		if (!is_array($labels)) {
			$labels = array_map('trim', explode(',', $labels));
		}
		$userIds = array();
		foreach ($labels as $label) {
			$userIds = array_merge($userIds, Users_Contact::select('contactUserId')
				->where(array(
					'userId' => $asUserId,
					'label' => $label
				))->fetchAll(PDO::FETCH_COLUMN));
		}
		return $userIds;
	}

	/**
	 * Returns Users_User object that correspond to the identifier in the database, if any.
	 * @method from
	 * @static
	 * @param {string|array} $type can be "username", "email", "mobile", or $platform."_".$appId",
	 *  or any of the above with optional "_hashed" suffix to indicate
	 *  that the value has already been hashed.
	 *  It could also be an array of ($type => $value) pairs.
	 *  Then the second parameter should be null.
	 * @param {string} $value The value corresponding to the type. If $type is
	 *
	 * * "username" - this is the user's username, if any
	 * * "email" - this is one of the user's email addresses
	 * * "mobile" - this is one of the user's mobile numbers
	 * * "email_hashed" - this is the standard hash of the user's email address
	 * * "mobile_hashed" - this is the standard hash of the user's mobile number
	 * * $platformApp - a string of the form $platform."_".$appId"
	 *
	 * @param {string} [$state='verified'] The state of the identifier => userId mapping.
	 *  Could also be 'future' to find identifiers attached to a "future user",
	 *  and can also be null (in which case we find mappings in all states)
	 * @param {&string} [$normalized=null]
	 * @return {Users_Identify|null}
	 *  The row corresponding to this type and value, otherwise null
	 */
	static function from($type, $value, $state = 'verified', &$normalized = null)
	{
		if ($type === 'none') {
			return null;
		}
		$ui = Users::identify($type, $value, null);
		if (!$ui || empty($ui->userId)) {
			return null;
		}
		$user = new Users_User();
		$user->id = $ui->userId;
		if (!$user->retrieve()) {
			$userId = $ui->userId;
			throw new Q_Exception_MissingRow(array(
				'table' => 'user',
				'criteria' => 'that id'
			), 'userId');
		}
		$state = $ui->state;
		return $user;
	}

	/**
	 * Loop through identifiers and return list of Users_User objects.
	 * Unless $dontInsertFutureUsers parameter is true, this function
	 * will create a future user whenever a user doesn't already exist
	 * corresponding to that identifier.
	 * @method idsFromIdentifiers
	 * @static
	 * @param $asUserId {string} The user id of inviting user
	 * @param {string|array} $identifiers Can be email addresses or mobile numbers,
	 *  passed either as an array or separated by "\t"
	 * @param {boolean} [$dontInsertFutureUsers=false] Pass true to skip inserting future users.
	 * @param {array} $statuses Optional reference to an array to populate with $status values ('verified' or 'future') in the same order as the $identifiers.
	 * @param {array} $identifierTypes Optional reference to an array to populate with $identifierTypes values in the same order as $identifiers	
	 * @return {array} The array of user ids, with the same indexes as the $identifiers.
	 */
	static function idsFromIdentifiers (
		$identifiers, 
		$dontInsertFutureUsers = false,
		&$statuses = array(), 
		&$identifierTypes = array()
	) {
		if (empty($identifiers)) {
			return array();
		}
		if (!is_array($identifiers)) {
			$identifiers = array_map('trim', explode("\t", $identifiers));
		}
		$users = array();
		foreach ($identifiers as $i => $identifier) {
			$identifierType = Users::identifierType($identifier, $ui_identifier);
			if (!isset($identifierType)) {
				throw new Q_Exception_WrongType(array(
					'field' => "identifier '$identifier",
					'type' => 'email address or mobile number'
				), array('identifier', 'emailAddress', 'mobileNumber'));
			}
			$status = null;
			if (!$dontInsertFutureUsers) {
				$users[] = Users::futureUser($identifierType, $ui_identifier, $status);
			} else {
				$users[] = null;
			}
			$statuses[] = $status;
			$identifierTypes[] = $identifierType;
		}
		return array_map(array('Users_User', '_getId'), $users);
	}
	
	/**
	 * Check platform xids or array of xids and return users - existing or future
	 * @method idsFromPlatformXids
	 * @static
	 * @param {string} $platform The name of the platform
	 * @param {string} $appId The id of an app on the platform
	 * @param {array|string} $xids An array of facebook user ids, or a comma-delimited string
	 * @param {array} $statuses Optional reference to an array to populate with $status values ('verified' or 'future') in the same order as the $identifiers.
	 * @param {boolean} [$dontInsertFutureUsers=false] Pass true to skip inserting future users.
	 * @return {array} The array of user ids
	 */
	static function idsFromPlatformXids (
		$platform,
		$appId,
		$xids, 
		$dontInsertFutureUsers = false,
		&$statuses = array()
	) {
		if (empty($xids)) {
			return array();
		}
		if (!is_array($xids)) {
			$xids = array_map('trim', explode(',', $xids));
		}
		$platformApp = $platform . '_' . $appId;
		$users = array();
		foreach ($xids as $xid) {
			if (!$dontInsertFutureUsers) {
				$users[] = Users::futureUser($platformApp, $xid, $status);
			} else {
				$users[] = Users_User::from($platformApp, $xid);
			}
			$statuses[] = $status;
		}
		return array_map(array('Users_User', '_getId'), $users);
	}

	/**
	 * Verifies that users exist for these ids
	 * @method verifyUserIds
	 * @static
	 * @param $userIds {string|array}
	 * @param $throw=false {boolean}
	 * @return {array} The array of found user ids
	 */
	static function verifyUserIds($userIds, $throw = false)
	{
		if (empty($userIds)) {
			return array();
		}

		if (is_string($userIds)) {
			$userIds = array_map('trim', explode(',', $userIds));
		}

		$users = Users_User::select('id')
			->where(array('id' => $userIds))
			->fetchAll(PDO::FETCH_COLUMN);

		if ($throw && count($users) < count($userIds)) {
			$diff = array_diff($userIds, $users);
			if (count($diff)) {
				$ids = join(', ', $diff);
				throw new Q_Exception_MissingRow(array(
					'table' => 'user',
					'criteria' => "ids ($ids)"
				), 'id');
			}
		}
		return $users;
	}

	/**
	 * Get client IP address
	 * @method getIP
	 * @static
	 */
	static function getIP () {
		if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
			$ip = $_SERVER['HTTP_CLIENT_IP'];
		} elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
			$ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
		} else {
			$ip = $_SERVER['REMOTE_ADDR'];
		}

		return $ip;
	}

	/**
	 * Remove users from system
	 * @method removeUser
	 * @static
	 * @param {string|array} $userId Array of id's or single id
	 */
	static function removeUser($userIds) {
		if (is_array($userIds)) {
			foreach ($userIds as $userId) {
				self::removeUser($userId);
			}

			return;
		}

		$db = self::db();
		$fieldsRelatedToUserId = array(
			"userId", "fromUserId", "toUserId", "byUserId", "ofUserId", "grantedByUserId", "invitingUserId",
			"contactUserId", "publisherId", "fromPublisherId", "toPublisherId");
		$tables = $db->rawQuery('SHOW TABLES')->fetchAll();
		foreach ($tables as $table) {
			$tableName = $table[0];
			$fields = $db->rawQuery("SHOW COLUMNS FROM ".$tableName)->execute()->fetchAll(PDO::FETCH_ASSOC);
			$query = "";
			foreach ($fields as $field) {
				$fieldName = $field["Field"];
				if (!in_array($fieldName, $fieldsRelatedToUserId)) {
					continue;
				}

				if ($query) {
					$query .= " or ".$fieldName."='".$userIds."'";
				} else {
					$query = "delete from ".$tableName." where ".$fieldName."='".$userIds."'";
				}
			}

			if ($query) {
				$db->rawQuery($query)->execute();
			}
		}

		Users_User::delete()
			->where(array('id' => $userIds))
			->execute();
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_User} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_User();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
	
	/**
	 * @property $fetch_cache
	 * @type array
	 * @protected
	 */
	protected $fetch_cache = array();
	/**
	 * @property $cache
	 * @type array
	 * @protected
	 * @static
	 */
	protected static $cache = array();
	
	/**
	 * @property $preloaded
	 * @static
	 * @type array
	 */
	static $preloaded = array();
};