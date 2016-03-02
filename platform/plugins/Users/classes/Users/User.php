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
	 * @return {Users_User|null}
	 * @throws {Users_Exception_NoSuchUser} If the URI contains an invalid "username"
	 */
	static function fetch ($userId, $throwIfMissing = false)
	{
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
	 * @param {string} [$basename=""] The last part after the slash, such as "50.png"
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
	 * @method exportArray
	 * @param {$array} [$options=null] can include the following:
	 *  "asAvatar": set to true if only the avatar fields should be exported
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
 		$name = Q::event('Users/User/displayName', compact('user', 'options'), 'before');
		return isset($name) ? $name : $this->username;
	}
	
	/**
	 * Use this function to compute the hash of a passphrase
	 * @param {array} $options to pass to any hooks
	 * @param {boolean} $isHashed Whether the first passphrase hash iteration occurred, e.g. on the client
	 */
	function computePassphraseHash($passphrase, $isHashed)
	{
		$user = $this;
		if ($result = Q::event("Users/computePassphraseHash", compact('passphrase', 'isHashed', 'user'), 'before')) {
			return $result;
		}
		if (!$isHashed) {
			$passphrase = sha1($passphrase . "\t" . $this->id);
		}
		return Users::hashPassphrase($passphrase, $this->passphraseHash);
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
			array('username' => & $username)
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
	 * @param {array} $modifiedFields
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
			if (!isset($updatedFields['username'])) {
				// put an empty username for now
				$this->username = $updatedFields['username'] = '';
			}
		}
		if (!empty($updatedFields['username'])) {
			$app = Q_Config::expect('Q', 'app');
			$unique = Q_Config::get('Users', 'model', $app, 'uniqueUsername', true);
			if ($unique) {
				$username = $updatedFields['username'];
				$criteria = compact('username');
				if (isset($this->id)) {
					$criteria['id != '] = $this->id;
				}
				$rows = Users_User::select('COUNT(1)')
					->where($criteria)->limit(1)
					->fetchAll(PDO::FETCH_NUM);
				$row = $rows[0];
				if ($row[0] > 0) {
					throw new Users_Exception_UsernameExists($criteria, 'username');
				}
			}
		}
		$user = $this;
		Q::event(
			'Users/User/save', 
			compact('user', 'updatedFields'),
			'before'
		);
		return parent::beforeSave($updatedFields);
	}
	
	function afterSaveExecute($result, $query, $modifiedFields, $where)
	{
		$user = $this;
		Q::event(
			'Users/User/save', 
			compact('user', 'result', 'query', 'modifiedFields', 'where'),
			'after'
		);
		return $result;
	}
	
	/**
	 * Add a contact label
	 * @method {boolean} addLabel
	 * @param {string} $label
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
		Users_Label::removeLabel($label, $this->id, $asUserId);
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
	 * @param {string} [$activationEmailSubject=null]
	 *  The subject of the activation email to send.
	 * @param {string} [$activationEmailView=null]
	 *  The view to use for the body of the activation email to send.
	 * @param {boolean} [$html=true]
	 *  Defaults to true. Whether to send as HTML email.
	 * @param {array} [$fields=array()]
	 *  An array of additional fields to pass to the email view.
	 * @param {array} $options=array()
	 *  Array of options. Can include:<br/>
	 *  "html" => Defaults to false. Whether to send as HTML email.<br/>
	 *  "name" => A human-readable name in addition to the address.<br/>
	 *  "from" => An array of (emailAddress, human_readable_name)<br/>
	 *  "delay" => A delay, in milliseconds, to wait until sending email. Only works if Node server is listening.
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
		$fields = array(),
		$options = array())
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
		if ($email->retrieve('*', array('ignoreCache' => true))
		and $email->state !== 'unverified') {
			if ($email->userId === $this->id) {
				$email->set('user', $this);
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
		$email->activationCode = strtolower(Q_Utils::unique(7));
		$email->activationCodeExpires = new Db_Expression(
			"CURRENT_TIMESTAMP + INTERVAL $minutes MINUTE"
		);
		$email->authCode = md5(microtime() + mt_rand());
		$link = 'Users/activate?code='.urlencode($email->activationCode) . ' emailAddress='.urlencode($email->address);
		$unsubscribe = 'Users/unsubscribe?' . http_build_query(array(
			'authCode' =>  $email->authCode, 
			'emailAddress' => $email->address
		));
		$communityName = Users::communityName();
		/**
		 * @event Users/addIdentifier {before}
		 * @param {string} user
		 * @param {string} email
		 */
		Q::event('Users/addIdentifier', compact('user', 'email', 'link', 'unsubscribe'), 'before');
		$email->save();
		
		$this->emailAddressPending = $normalized;
		$this->save();
		
		if (!isset($activationEmailView)) {
			$activationEmailView = Q_Config::get(
				'Users', 'transactional', 'activation', 'body', 'Users/email/activation.php'
			);
		}
		if (!isset($activationEmailSubject)) {
			$activationEmailSubject = Q_Config::get(
				'Users', 'transactional', 'activation', 'subject', "Welcome! Please confirm your email address." 
			);
		}

		$fields2 = array_merge($fields, array(
			'user' => $this,
			'email' => $email,
			'app' => Q_Config::expect('Q', 'app'),
			'communityName' => $communityName,
			'baseUrl' => Q_Request::baseUrl(),
			'link' => $link,
			'unsubscribe' => $unsubscribe
		));
		$email->sendMessage(
			$activationEmailSubject, 
			$activationEmailView, 
			$fields2,
			$options
		); // may throw exception if badly configured
		
		/**
		 * @event Users/addIdentifier {after}
		 * @param {string} user
		 * @param {string} email
		 */
		Q::event('Users/addIdentifier', compact('user', 'email', 'link'), 'after');
	}
	
	/**
	 * @method setEmailAddress
	 * @param {string} $emailAddress
	 * @param {boolean} [$verified=false]
	 * @throws {Q_Exception_MissingRow}
	 *	If e-mail address is missing
	 * @throws {Users_Exception_AlreadyVerified}
	 *	If user is already verified
	 * @throws {Users_Exception_WrongState}
	 *	If verification state is wrong
	 */
	function setEmailAddress($emailAddress, $verified = false)
	{
		$email = new Users_Email();
		Q_Valid::email($emailAddress, $normalized);
		$email->address = $normalized;
		$retrieved = $email->retrieve('*', array('ignoreCache' => true));
		if (empty($email->activationCode)) {
			$email->activationCode = '';
			$email->activationCodeExpires = '0000-00-00 00:00:00';
		}
		$email->authCode = md5(microtime() + mt_rand());
		if ($verified) {
			$email->userId = $this->id;
		} else {
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
		Q::event('Users/setEmailAddress', compact('user', 'email'), 'after');
		return true;
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
	 * @param {array} $options=array()
	 *  Array of options. Can include:<br/>
	 *  "delay" => A delay, in milliseconds, to wait until sending email. Only works if Node server is listening.
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
		$fields = array(),
		$options = array())
	{
		if (!Q_Valid::phone($mobileNumber, $normalized)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'Mobile phone', 
				'range' => 'a valid number'
			), 'mobileNumber');
		}
		$mobile = new Users_Mobile();
		$mobile->number = $normalized;
		if ($mobile->retrieve('*', array('ignoreCache' => true))
		and $mobile->state !== 'unverified') {
			if ($mobile->userId === $this->id) {
				$mobile->set('user', $this);
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
		$mobile->activationCode = strtolower(Q_Utils::unique(7));
		$mobile->activationCodeExpires = new Db_Expression(
			"CURRENT_TIMESTAMP + INTERVAL $minutes MINUTE"
		);
		$number = $mobile->number;
		if (substr($number, 0, 2) == '+1') {
			$number = substr($number, 2);
		}
		$mobile->authCode = md5(microtime() + mt_rand());
		$link = 'Users/activate?code='.urlencode($mobile->activationCode)
			. ' mobileNumber='.urlencode($number);
		$communityName = Users::communityName();
		/**
		 * @event Users/addIdentifier {before}
		 * @param {string} user
		 * @param {string} mobile
		 */
		Q::event('Users/addIdentifier', compact('user', 'mobile', 'link'), 'before');
		$mobile->save();
		
		$this->mobileNumberPending = $normalized;
		$this->save();
		
		if (!isset($activationMessageView)) {
			$activationMessageView = Q_Config::get(
				'Users', 'transactional', 'activation', 'sms', 'Users/sms/activation.php'
			);
		}

		$fields2 = array_merge($fields, array(
			'user' => $this,
			'mobile' => $mobile,
			'app' => Q_Config::expect('Q', 'app'),
			'communityName' => $communityName,
			'baseUrl' => Q_Request::baseUrl(),
			'link' => $link
		));
		$mobile->sendMessage(
			$activationMessageView, 
			$fields2,
			$options
		);
		
		Q_Response::removeNotice('Users/mobile');
		
		/**
		 * @event Users/addIdentifier {after}
		 * @param {string} user
		 * @param {string} mobile
		 */
		Q::event('Users/addIdentifier', compact('user', 'mobile', 'link'), 'after');
	}
	
	/**
	 * @method setMobileNumber
	 * @param {string} $mobileNumber
	 * @param {boolean} [$verified=false]
	 * @throws {Q_Exception_MissingRow}
	 *	If mobile number is missing
	 * @throws {Users_Exception_AlreadyVerified}
	 *	If user was already verified
	 * @throws {Users_Exception_WrongState}
	 *	If verification state is wrong
	 */
	function setMobileNumber($mobileNumber, $verified = false)
	{
		Q_Valid::phone($mobileNumber, $normalized);
		$mobile = new Users_Mobile();
		$mobile->number = $normalized;
		$retrieved = $mobile->retrieve('*', array('ignoreCache' => true));
		if (empty($mobile->activationCode)) {
			$mobile->activationCode = '';
			$mobile->activationCodeExpires = '0000-00-00 00:00:00';
		}
		$mobile->authCode = md5(microtime() + mt_rand());
		if ($verified) {
			$mobile->userId = $this->id;
		} else {
			if (!$retrieved) {
				throw new Q_Exception_MissingRow(array(
					'table' => "a mobile phone",
					'criteria' => "number $normalized"
				), 'mobileNumber');
			}
			if ($mobile->userId != $this->id) {
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
		Q::event('Users/setMobileNumber', compact('user', 'mobile'), 'after');
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
		|| substr($this->icon, 0, 7) === 'default'
		|| substr($this->icon, 0, 6) === 'future') {
			$hash = md5(strtolower(trim($identifier)));
			$icon = array(
				'40.png' => array('hash' => $hash, 'size' => 40),
				'50.png' => array('hash' => $hash, 'size' => 50),
				'80.png' => array('hash' => $hash, 'size' => 80)
			);
			Users::importIcon($this, $icon);
		}
		return true;
	}
	
	/**
	 * get user id
	 * @method _getId
	 * @static
	 * @private
	 * @param {Users_User} $u
	 * @return {string}
	 */
	private static function _getId ($u) { return $u->id; }
	
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
	 * Check identifier or array of identifiers and return users - existing or future
	 * @method idsFromIdentifiers
	 * @static
	 * @param $asUserId {string} The user id of inviting user
	 * @param $identifiers {string|array}
	 * @param $statuses {array} Optional reference to an array to populate with $userId => $status pairs.
	 * @return {array} The array of user ids
	 */
	static function idsFromIdentifiers ($identifiers, &$statuses = array())
	{
		if (empty($identifiers)) return array();
		if (!is_array($identifiers)) {
			$identifiers = array_map('trim', explode(',', $identifiers));
		}
		$users = array();
		foreach ($identifiers as $identifier) {
			if (Q_Valid::email($identifier, $emailAddress)) {
				$ui_identifier = $emailAddress; 
				$type = 'email';
			} else if (Q_Valid::phone($identifier, $mobileNumber)) {
				$ui_identifier = $mobileNumber; 
				$type = 'mobile';
			} else {
				throw new Q_Exception_WrongType(array(
					'field' => 'identifier',
					'type' => 'email address or mobile number'
				), array('emailAddress', 'mobileNumber'));
			}
			$status = null;
			$users[] = $user = Users::futureUser($type, $ui_identifier, $status);
			$statuses[$user->id] = $status;
		}
		return array_map(array('Users_User', '_getId'), $users);
	}
	
	/**
	 * Check fb identifier or array of identifiers and return users - existing or future
	 * @method idsFromFacebook
	 * @static
	 * @param $asUserId {string} The user id of inviting user
	 * @param $identifiers {string|array}
	 * @return {array} The array of user ids
	 */
	static function idsFromFacebook ($identifiers)
	{
		if (empty($identifiers)) return array();
		if (!is_array($identifiers)) {
			$identifiers = array_map('trim', explode(',', $identifiers));
		}
		$users = array();
		foreach ($identifiers as $identifier) {
			$users[] = Users::futureUser('facebook', $identifier);
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
		if (empty($userIds)) return array();

		if (!is_array($userIds)) {
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