<?php
/**
 * Users plugin
 * @module Users
 * @main Users
 */
/**
 * Static methods for the Users models.
 * @class Users
 * @extends Base_Users
 * @abstract
 */
abstract class Users extends Base_Users
{
	/*
	 * This is where you would place all the static methods for the models,
	 * the ones that don't strongly pertain to a particular row or table.

	 * * * */
	
	/**
	 * Determine whether a user id is that of a community
	 * @method isCommunityId
	 * @static
	 * @param {string} $userId The user id to test 
	 * @return {boolean}
	 */
	static function isCommunityId($userId)
	{
        if (in_array($userId, Q_Config::expect("Q", "plugins"))) {
			return false;
        }
		$first = mb_substr($userId, 0, 1, "UTF-8");
		return (mb_strtolower($first, "UTF-8") != $first);
	}
	
	/**
	 * Check if an icon is custom or whether it's been automatically generated
	 * @method isCustomIcon
	 * @static
	 * @param {String} $icon
	 * @return {boolean}
	 */
	static function isCustomIcon ($icon) {
		if (!$icon) {
			return false;
		}
		return strpos($icon, 'imported') !== false
		|| preg_match("/\/icon\/[0-9]+/", $icon)
		|| strpos($icon, 'invited') !== false;
	}

	/**
	 * Get the id of the main community from the config. Defaults to the app name.
	 * @method communityId
	 * @static
	 * @return {string} The id of the main community for the installed app.
	 */
	static function communityId()
	{
		$communityId = Q_Config::get('Users', 'community', 'id', null);
		return $communityId ? $communityId : Q::app();
	}
	/**
	 * Get the id of a currently selected community, if one was set in the session.
	 * The default return value is the id of the main community, Users::communityId()
	 * @method currentCommunityId
	 * @static
	 * @param {bool} $defaultMainCommunity If true and communityId from session empty, use main community id.
	 * @return {string} The id of the current community
	 */
	static function currentCommunityId($defaultMainCommunity = false)
	{
		$communityId = Q::ifset($_SESSION, 'Users', 'communityId', null);

		if (!$communityId && $defaultMainCommunity) {
			$communityId = self::communityId();
		}

		return $communityId;
	}
	/**
	 * Get the name of the main community from the config. Defaults to the app name.
	 * @method communityName
	 * @static
	 * @param {boolean} $includeSuffix Whether to include the community suffix
	 * @return {string} The name of the main community for the installed app.
	 */
	static function communityName($includeSuffix = false)
	{
		$communityName = Q_Config::get('Users', 'community', 'name', null);
		$suffix = Q_Config::get('Users', 'community', 'suffix', null);
		if (!$communityName) {
			$communityName = Q::app();
		}
		if ($suffix) {
			$communityName .= " $suffix";
		}
		return $communityName;
	}
	
	/**
	 * Get the suffix of the main community from the config, such as "Inc." or "LLC"
	 * @return {string|null} The suffix of the main community for the installed app.
	 */
	static function communitySuffix()
	{
		return Q_Config::get('Users', 'community', 'suffix', null);
	}
	/**
	 * Get default user language from users_user table
	 * @method getLanguage
	 * @static
	 * @param {string} $userId
	 * @return {string}
	 */
	static function getLanguage($userId)
	{
		$user = self::fetch($userId, true);
		return isset($user->preferredLanguage) ? $user->preferredLanguage : Q_Text::$language;
	}
	
	/**
	 * Return an array of the user's roles relative to a publisher
	 * @method roles
	 * @static
	 * @param string [$publisherId=Users::communityId()]
	 *  The id of the publisher relative to whom to calculate the roles.
	 *  Defaults to the community id.
	 * @param {string|array|Db_Expression} [$filter=null] 
	 *  You can pass additional criteria here for the label field
	 *  in the `Users_Contact::select`, such as an array or Db_Range
	 * @param {array} [$options=array()] Any additional options to pass to the query, such as "ignoreCache"
	 * @param {string} [$userId=null] If not passed, the logged in user is used, if any
	 * @return {array} An associative array of $roleName => $contactRow pairs
	 */
	static function roles(
		$publisherId = null,
		$filter = null,
		$options = array(),
		$userId = null)
	{
		if (empty($publisherId)) {
			$publisherId = Users::communityId();
		}
		if (!isset($userId)) {
			$user = Users::loggedInUser(false, false);
			if (!$user) {
				return array();
			}
			$userId = $user->id;
		}
		$contacts = Users_Contact::select()
			->where(array(
				'userId' => $publisherId,
				'contactUserId' => $userId
			))->andWhere($filter ? array('label' => $filter) : null)
			->options($options)
			->fetchDbRows(null, null, 'label');
		return $contacts;
	}
	/**
	 * Return an array of users_contact rows where user assigned by labels
	 * @method byRoles
	 * @static
	 * @param {string|array|Db_Expression} [$filter=null]
	 *  You can pass additional criteria here for the label field
	 *  in the `Users_Contact::select`, such as an array or Db_Range
	 * @param {array} [$options=array()] Any additional options to pass to the query, such as "ignoreCache"
	 * @param {bool} [$options.onlyCommunities=false] Set this to true if you want to get only communities rows (userId - is community).
	 * @param {string} [$userId=null] If not passed, the logged in user is used, if any
	 * @return {array} An associative array of $roleName => $contactRow pairs
	 * @throws {Users_Exception_NotLoggedIn}
	 */
	static function byRoles ($filter = null, $options = array(), $userId = null)
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser(false, false);
			if (!$user) {
				return array();
			}
			$userId = $user->id;
		}

		$contacts = Users_Contact::select()
			->where(array(
				'contactUserId' => $userId
			))->andWhere($filter ? array('label' => $filter) : null)
			->options($options)
			->fetchDbRows(null, null, 'userId');

		if (Q::ifset($options, "onlyCommunities", false)) {
			foreach ($contacts as $i => $contact) {
				if (Users::isCommunityId($contact->userId)) {
					continue;
				}

				unset($contacts[$i]);
			}
		}

		return $contacts;
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
		return Users_User::fetch($userId, $throwIfMissing);
	}

	/**
	 * @method oAuth
	 * @static
	 * @param {string} $platform The name of the oAuth platform, under Users/apps config
	 * @param {string} [$appId=Q::app()] Only needed if you have multiple apps on platform
	 * @return {Zend_Oauth_Client}
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function oAuth($platform, $appId = null)
	{
		return;
		// TODO: REFACTOR TO USE oAuth 2
		/*
		$nativeuser = self::loggedInUser();

		if(!$nativeuser)
			throw new Users_Exception_NotLoggedIn();

		if (!isset($appId)) {
			$appId = Q::app();
		}

		#Set up oauth options
		$oauthOptions = Q_Config::expect('Users', 'apps', $platform, $appId, 'oauth');
		$customOptions = Q_Config::get('Users', 'apps', $platform, $appId, 'options', null);

		#If the user already has a token in our DB:
		$externalFrom = new Users_ExternalFrom();
		$externalFrom->userId = $nativeuser->id;
		$externalFrom->platform = $platform;
		$externalFrom->appId = $appId;

		if($externalFrom->retrieve())
		{
				$zt = new Zend_Oauth_Token_Access();
				$zt->setToken($externalFrom->access_token);
				$zt->setTokenSecret($externalFrom->session_secret);

				return $zt->getHttpClient($oauthOptions);
		}

		#Otherwise, obtain a token from platform:
		$consumer = new Zend_Oauth_Consumer($oauthOptions);

		if(isset($_GET['oauth_token']) && isset($_SESSION[$platform.'_request_token'])) //it's a redirect back from google
		{
			$token = $consumer->getAccessToken($_GET, unserialize($_SESSION[$platform.'_request_token']));

			$_SESSION[$platform.'_access_token'] = serialize($token);
			$_SESSION[$platform.'_request_token'] = null;

			#Save tokens to database
			$externalFrom->accessToken = $token->getToken();
			$externalFrom->setExtra('secret') = $token->getTokenSecret();
			$externalFrom->save();

			return $token->getHttpClient($oauthOptions);
		}
		else //it's initial pop-up load
		{
			$token = $consumer->getRequestToken($customOptions);

			$_SESSION[$platform.'_request_token'] = serialize($token);

			$consumer->redirect();

			return null;
		}
		*/

	}

	/**
	 * @method oAuthClear
	 * @static
	 * @param {string} $platform The name of the oAuth platform, under Users/apps config
	 * @param {string} [$appId=Q::app()] Only needed if you have multiple apps on platform
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function oAuthClear($platform, $appId = null)
	{
		return;
		// TODO: REFACTOR THIS
		/*
		$nativeuser = self::loggedInUser();

		if(!$nativeuser)
			throw new Users_Exception_NotLoggedIn();
		
		if (!isset($appId)) {
			$app = Q::app();
			list($appId, $appInfo) = Users::appInfo($platform, $appId);
			$appId = Q_Config::expect('Users', 'apps', $platform, $app, 'appId');
		}

		$externalFrom = new Users_ExternalFrom();
		$externalFrom->userId = $nativeuser->id;
		$externalFrom->platform = $platform;
		$externalFrom->appId = $appId;
		$externalFrom->retrieve();
		$externalFrom->remove();
		*/
	}

	/**
	 * Retrieves the currently logged-in user from the session.
	 * If the user was not originally retrieved from the database,
	 * inserts a new one.
	 * Thus, this can also be used to turn visitors into registered
	 * users by authenticating with some external platform.
	 * @method authenticate
	 * @static
	 * @param {string} $platform Currently only supports "facebook", "ios" or "android"
	 * @param {string} [$appId=null] The id of the app within the specified platform.
	 * @param {&boolean} [$authenticated=null] If authentication fails, puts false here.
	 *  Otherwise, puts one of the following:
	 *  * 'registered' if user just registered,
	 *  * 'adopted' if a futureUser was just adopted,
	 *  * 'connected' if a logged-in user just connected the platform account for the first time,
	 *  * 'authorized' if a logged-in user was connected to platform but just authorized this app for the first time
	 *  or true otherwise.
	 * @param {array} [$import=Q_Config::get('Users','import',$platform)]
	 *  Array of things to import from platform if a new user is being inserted or displayName was not set.
	 *  Can include various fields of the user on the external platform, such as
	 *  "email", "first_name", "last_name", "gender" etc.
	 *  If the email address is imported, it is set without requiring verification, and
	 *  any email under Users/transactional/authenticated is sent.
	 * @return {Users_User}
	 */
	static function authenticate(
		$platform,
		$appId = null,
		&$authenticated = null,
		$import = null)
	{
		$platforms = Q_Config::get('Users', 'apps', 'platforms', array());
		if (!in_array($platform, $platforms)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'platform',
				'range' => 'One of the platforms named in Users/apps/platforms config'
			));
		}
		
		if (!isset($appId)) {
			$appId = Q::app();
		}
		list($appId, $appInfo) = Users::appInfo($platform, $appId);
		if (!isset($appInfo['appId'])) {
			throw new Q_Exception_WrongType(array(
				'field' => 'appId', 
				'type' => "a valid $platform app id"
			));
		}
		$appId = $appInfo['appId'];
		
		$authenticated = null;
		$during = 'authenticate';
		$return = null;
		
		/**
		 * @event Users/authenticate {before}
		 * @param {string} platform
		 * @param {string} appId
		 * @return {Users_User}
		 */
		$return = Q::event('Users/authenticate', @compact('platform', 'appId'), 'before');
		if (isset($return)) {
			return $return;
		}

		Q_Session::start();

		// First, see if we've already logged in somehow
		if ($user = self::loggedInUser()) {
			// Get logged in user from session
			$userWasLoggedIn = true;
			$retrieved = true;
		} else {
			// Get an existing user or create a new one
			$userWasLoggedIn = false;
			$retrieved = false;
			$user = new Users_User();
		}
		$authenticated = false;
		$emailAddress = null;

		// Try authenticating the user with the specified platform
		$externalFrom = Users_ExternalFrom::authenticate($platform, $appId);
		if (!$externalFrom) {
			// no authentication happened
			return $userWasLoggedIn ? $user : false;
		}
		$xid = $externalFrom->xid;
		$authenticated = true;
		$appIdForAuth = !empty($appInfo['appIdForAuth'])
			? $appInfo['appIdForAuth']
			: $appInfo['appId'];
		$platformApp = $platform . '_' . $appIdForAuth;
		if ($retrieved) {
			$user_xid = $user->getXid($platformApp);
			if (!$user_xid) {
				// this is a logged-in user who was never authenticated with this platform.
				// First, let's find any other user who has authenticated with the
				// authenticated xid, and set their $field to 0.
				$authenticated = 'connected';
				$ui = Users::identify($platformApp, $xid);
				if ($ui) {
					$u = new Users_User();
					$u->id = $ui->userId;
					if ($u->retrieve()) {
						$u->clearXid($platformApp);
						$u->save();
					};
					$ui->remove();
				}

				// Now, let's associate the current user's account with this platform xid.
				if (!$user->displayName()) {
					// import some fields automatically from the platform
					$imported = $externalFrom->import($import);
				}
				$user->setXid($platformApp, $xid);
				$user->save();

				// Save the identifier in the quick lookup table
				list($hashed, $ui_type) = self::hashing($xid, $platformApp);
				$ui = new Users_Identify();
				$ui->identifier = "$ui_type:$hashed";
				$ui->state = 'verified';
				$ui->userId = $user->id;
				$ui->save(true);
			} else if ($user_xid !== $xid) {
				// The logged-in user was authenticated with the platform already,
				// and associated with a different platform xid.
				// Most likely, a completely different person has logged into the platform
				// at this computer. So rather than changing the associated plaform xid
				// for the logged-in user, simply log out and essentially run this function
				// from the beginning again.
				Users::logout();
				$userWasLoggedIn = false;
				$user = new Users_User();
				$retrieved = false;
			}
		}
		if (!$retrieved) {
			$ui = Users::identify($platformApp, $xid, null);
			if ($ui) {
				Users::$cache['user'] = $user = new Users_User();
				$user->id = $ui->userId;
				$exists = $user->retrieve();
				if (!$exists) {
					
					throw new Q_Exception("Users_Identify for $platform xid $xid exists but not user with id {$ui->userId}");
				}
				$retrieved = true;
				if ($ui->state === 'future') {
					$authenticated = 'adopted';
					$platformApp = $platform . '_' . $appIdForAuth;
					$user->setXid($platformApp, $xid);
					$user->signedUpWith = $platformApp; // should have been "none" before this
					/**
					 * @event Users/adoptFutureUser {before}
					 * @param {Users_User} user
					 * @param {string} during
					 * @return {Users_User}
					 */
					$ret = Q::event('Users/adoptFutureUser', @compact('user', 'during'), 'before');
					if ($ret) {
						$user = $ret;
					}
					$imported = $externalFrom->import($import);
					$user->save();

					$ui->state = 'verified';
					$ui->save();
					/**
					 * @event Users/adoptFutureUser {after}
					 * @param {Users_User} user
					 * @param {array} links
					 * @param {string} during
					 * @return {Users_User}
					 */
					Q::event('Users/adoptFutureUser', @compact('user', 'links', 'during'), 'after');
				} else {
					// If we are here, that simply means that we already verified the
					// $xid => $userId mapping for some existing user who signed up
					// and has been using the system. So there is nothing more to do besides
					// setting this user as the logged-in user below.
				}
			} else {
				// user is logged out and no user corresponding to $xid yet

				$authenticated = 'registered';
				
				$imported = $externalFrom->import($import);
				if (!empty($imported['email'])) {
					$ui = Users::identify('email', $imported['email'], 'verified');
					if ($ui) {
						// existing user identified from verified email address
						// load it into $user
						$user = new Users_User();
						$user->id = $ui->userId;
						$user->retrieve(null, null, true)
						->caching()
						->resume();
					}
				}

				$platformApp = $platform . '_' . $appIdForAuth;
				$user->setXid($platformApp, $xid);
				/**
				 * @event Users/insertUser {before}
				 * @param {Users_User} user
				 * @param {string} during
				 * @return {Users_User}
				 */
				$ret = Q::event('Users/insertUser', @compact('user', 'during'), 'before');
				if (isset($ret)) {
					$user = $ret;
				}

				// Register a new user basically and give them an empty username for now
				$user->username = "";
				$user->icon = '{{Users}}/img/icons/default';
				$user->signedUpWith = $platform;
				$user->save();

				// Save the identifier in the quick lookup table
				$platformApp = $platform . '_' . $appIdForAuth;
				list($hashed, $ui_type) = self::hashing($xid, $platformApp);
				$ui = new Users_Identify();
				$ui->identifier = "$ui_type:$hashed";
				$ui->state = 'verified';
				$ui->userId = $user->id;
				$ui->save(true);

				// Download and save platform icon for the user
				$sizes = array_keys(Q_Image::getSizes('Users/icon'));
				sort($sizes);
				$icon = $externalFrom->icon($sizes, '.png');
				if (!Q_Config::get('Users', 'register', 'icon', 'leaveDefault', false)) {
					self::importIcon($user, $icon);
					$user->save();
				}
		 	}
		}
		$externalFrom->userId = $user->id;
		Users::$cache['platformUserData'] = null; // in case some other user is saved later
		Users::$cache['authenticated'] = $authenticated;
		Users::$cache['user'] = $user;
		Users::$cache['externalFrom'] = $externalFrom;

		if (!empty($imported['email']) and empty($user->emailAddress)) {
			$emailAddress = $imported['email'];
			// We automatically set their email as verified, without a confirmation message,
			// because we trust the authentication platform.
			$user->setEmailAddress($emailAddress, true, $email);
			// But might send a welcome email to the users who just authenticated
			$emailSubject = Q_Config::get('Users', 'transactional', 'authenticated', 'subject', false);
			$emailView = Q_Config::get('Users', 'transactional', 'authenticated', 'body', false);
			if ($emailSubject !== false and $emailView) {
				$email->sendMessage($emailAddress, $emailSubject, $emailView);
			}
		}
		$cookiesToClearOnLogout = $externalFrom->get('cookiesToClearOnLogout', null);
		if (!$userWasLoggedIn) {
			self::setLoggedInUser($user, @compact('cookiesToClearOnLogout'));
		}

		if ($retrieved) {
			/**
			 * @event Users/updateUser {after}
			 * @param {Users_User} user
			 * @param {Users_ExternalFrom} externalFrom
			 * @param {string} during
			 */
			Q::event('Users/updateUser', @compact('user', 'externalFrom', 'during'), 'after');
		} else {
			/**
			 * @event Users/insertUser {after}
			 * @param {Users_User} 'user'
			 * @param {Users_ExternalFrom} externalFrom
			 * @param {string} during
			 */
			Q::event('Users/insertUser', @compact('user', 'externalFrom', 'during'), 'after');
		}

		// Now make sure our master session contains the
		// session info for the platform app.
		$accessToken = $externalFrom->accessToken;
		$sessionExpires = $externalFrom->expires;
		if (isset($_SESSION['Users']['appUsers'][$platformApp])) {
			// Platform app user exists. Do we need to update it? (Probably not!)
			$pk = $_SESSION['Users']['appUsers'][$platformApp];
			$ef = Users_ExternalFrom::select()->where($pk)->fetchDbRow();
			if (empty($ef)) {
				// somehow this externalFrom disappeared from the database
				throw new Q_Exception_MissingRow(array(
					'table' => 'ExternalFrom',
					'criteria' => http_build_query($pk, '', ' & ')
				));
			}

			if (!isset($ef->accessToken)
			or ($ef->accessToken != $externalFrom->accessToken)) {
				/**
				 * @event Users/authenticate/updateExternalFrom {before}
				 * @param {Users_User} user
				 */
				Q::event('Users/authenticate/updateExternalFrom', @compact('user', 'externalFrom'), 'before');
				$ef->accessToken = $accessToken;
				$ef->expires = $sessionExpires;
				$ef->save(); // update accessToken in externalFrom
				/**
				 * @event Users/authenticate/updateExternalFrom {after}
				 * @param {Users_User} user
				 */
				Q::event('Users/authenticate/updateExternalFrom', @compact('user', 'externalFrom'), 'after');
			}
		} else {
			// We have to put the session info in
			if ($externalFrom->retrieve(null, true)) {
				// App user exists in database. Do we need to update it?
				if (!isset($externalFrom->accessToken)
				or $externalFrom->accessToken != $accessToken) {
					/**
					 * @event Users/authenticate/updateExternalFrom {before}
					 * @param {Users_User} user
					 */
					Q::event('Users/authenticate/updateExternalFrom', @compact('user', 'externalFrom'), 'before');
					$externalFrom->accessToken = $accessToken;
					$externalFrom->save(); // update accessToken in externalFrom
					/**
					 * @event Users/authenticate/updateExternalFrom {after}
					 * @param {Users_User} user
					 */
					Q::event('Users/authenticate/updateExternalFrom', @compact('user', 'externalFrom'), 'after');
				}
			} else {
				/**
				 * @event Users/insertExternalFrom {before}
				 * @param {Users_User} user
				 * @param {string} 'during'
				 */
				Q::event('Users/insertExternalFrom', @compact('user', 'during'), 'before');
				// The following may update an existing externalFrom row
				// in the rare event that someone tries to tie the same
				// platform account to two different accounts.
				// A platform app user can only be tied to one native user, so the
				// old connection will be dropped, and the new connection saved.
				$externalFrom->save(true);
				/**
				 * @event Users/authenticate/insertExternalFrom {after}
				 * @param {Users_User} user
				 */
				Q::event('Users/authenticate/insertExternalFrom', @compact('user'), 'after');

				if (!isset($authenticated)){
					$authenticated = 'authorized';
				}
			}
		}

		$_SESSION['Users']['appUsers'][$platformApp] = $externalFrom->getPkValue();

		Users::$cache['authenticated'] = $authenticated;

		/**
		 * @event Users/authenticate {after}
		 * @param {string} platform
		 * @param {string} appId
		 */
		Q::event('Users/authenticate', @compact('platform', 'appId'), 'after');

		// At this point, $user is set.
		return $user;
	}

	/**
	 * Logs a user in using a login identifier and a pasword
	 * @method login
	 * @static
	 * @param {string} $identifier Could be an email address, a mobile number, or a user id.
	 * @param {string} $passphrase The passphrase to hash, etc.
	 * @param {boolean} $isHashed Whether the first passphrase hash iteration occurred, e.g. on the client
	 * @return {Users_User}
	 * @throws {Q_Exception_RequiredField} If 'identifier' field is not defined
	 * @throws {Q_Exception_WrongValue} If identifier is not e-mail or modile
	 * @throws {Users_Exception_NoSuchUser} If user does not exists
	 * @throws {Users_Exception_WrongPassphrase} If passphrase is wrong
	 */
	static function login(
		$identifier,
		$passphrase,
		$isHashed)
	{
		$return = null;
		/**
		 * @event Users/login {before}
		 * @param {string} identifier
		 * @param {string} passphrase
		 * @return {Users_User}
		 */
		$return = Q::event('Users/login', @compact('identifier', 'passphrase'), 'before');
		if (isset($return)) {
			return $return;
		}

		if (!isset($identifier)) {
			throw new Q_Exception_RequiredField(array('field' => 'identifier'), 'identifier');
		}

		Q_Session::start();
		$sessionId = Q_Session::id();

		if (Q_Valid::email($identifier, $emailAddress)) {
			$user = Users::userFromContactInfo('email', $emailAddress);
		} else if (Q_Valid::phone($identifier, $mobileNumber)) {
			$user = Users::userFromContactInfo('mobile', $mobileNumber);
		} else {
			throw new Q_Exception_WrongValue(array(
				'field' => 'identifier',
				'range' => 'email address or mobile number'
			), array('identifier', 'emailAddress', 'mobileNumber'));
		}
		if (!$user) {
			throw new Users_Exception_NoSuchUser(@compact('identifier'));
		}

		// First, see if we've already logged in somehow
		if ($logged_in_user = self::loggedInUser()) {
			// Get logged in user from session
			if ($logged_in_user->id === $user->id) {
				return $logged_in_user;
			}
		}

		// User exists in database. Now check the passphrase.
		if (!$user->passphraseHash or $user->passphraseHash[0] !== '$') {
			throw new Users_Exception_WrongPassphrase(@compact('identifier'), 'passphrase');
		} else {
			if (!$isHashed) {
				$passphrase = sha1($passphrase . "\t" . $user->id);
			}
			if (!Users::verifyPassphrase($passphrase, $user->passphraseHash)) {
				throw new Users_Exception_WrongPassphrase(@compact('identifier'), 'passphrase');
			}
		}

		// Now save this user in the session as the logged-in user
		self::setLoggedInUser($user);

		/**
		 * @event Users/login {after}
		 * @param {string} identifier
		 * @param {string} passphrase
		 * @param {Users_User} 'user'
		 */
		Q::event('Users/login', @compact(
			'identifier', 'passphrase', 'user'
		), 'after');

		return $user;
	}

	/**
	 * Logs a user out
	 * @method logout
	 * @static
	 */
	static function logout()
	{
		// Access the session, if we haven't already.
		$user = self::loggedInUser();
		$sessionId = Q_Session::id();

		/**
		 * One last chance to do something.
		 * Hooks shouldn't be able to cancel the logout, though.
		 * @event Users/logout {before}
		 * @param {Users_User} user
		 */
		Q::event('Users/logout', @compact('user'), 'before');

		$deviceId = null;
		if ($session = Q_Session::row()) {
			$deviceId = isset($session->deviceId) ? $session->deviceId : null;
		}
		
		if ($user) {
			Q_Utils::sendToNode(array(
				"Q/method" => "Users/logout",
				"sessionId" => $sessionId,
				"userId" => $user->id,
				"deviceId" => $deviceId
			));

			// forget the device for this user/session
			Users_Device::delete()->where(array(
				'userId' => $user->id,
				'sessionId' => $sessionId
			))->execute();
		}

		if (!empty($_SESSION['Users']['cookiesToClearOnLogout'])) {
			foreach ($_SESSION['Users']['cookiesToClearOnLogout'] as $parts) {
				Q_Response::clearCookie($parts[0], $parts[1]);
			}
		}

		// Destroy the current session, which clears the $_SESSION and all notices, etc.
		Q_Session::destroy();
		
		/**
		 * After the logout has taken place
		 * @event Users/logout {after}
		 * @param {Users_User} user
		 */
		Q::event('Users/logout', @compact('user'), 'after');
	}

	/**
	 * Get the logged-in user's information
	 * @method loggedInUser
	 * @static
	 * @param {boolean} [$throwIfNotLoggedIn=false]
	 *   Whether to throw a Users_Exception_NotLoggedIn if no user is logged in.
	 * @param {boolean} [$startSession=true]
	 *   Whether to start a PHP session if one doesn't already exist.
	 * @return {Users_User|null}
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in and
	 *   $throwIfNotLoggedIn is true
	 */
	static function loggedInUser(
		$throwIfNotLoggedIn = false,
		$startSession = true)
	{
		if ($startSession === false and !Q_Session::id()) {
			return null;
		}
		Q_Session::start();

		$nonce = Q_Session::$nonceWasSet or Q_Valid::nonce($throwIfNotLoggedIn, false);

		if (!$nonce or !isset($_SESSION['Users']['loggedInUser']['id'])) {
			if ($throwIfNotLoggedIn) {
				throw new Users_Exception_NotLoggedIn();
			}
			return null;
		}
		$id = $_SESSION['Users']['loggedInUser']['id'];
		$user = Users_User::fetch($id);
		if (!$user) {
			throw new Users_Exception_NotLoggedIn();
		}

		return $user;
	}

	/**
	 * Use with caution! This bypasses the usual methods of authentication.
	 * This functionality should not be exposed externally.
	 * @method setLoggedInUser
	 * @static
	 * @param {Users_User|string} $user The user object or user id
	 * @param {array} [$options] Some options for the method
	 * @param {string} [$options.notice=Q_Config::expect('Users','login','notice')]
	 *  A notice to show to the newly logged-in user that they have been
	 *  logged in. This notice only appears if another user was logged in
	 *  before this method was called, to draw their attention to the sudden
	 *  switch. To turn off this notice, pass null here.
	 * @param {boolean} [$options.keepSessionId=false]
	 *  Set to true to skip regenerating the session id, perhaps because you just
	 *  generated your own session id and you are sure that 
	 *  there cannot be any session fixation attacks.
	 * @param {array} [$options.cookiesToClearOnLogout=array()]
	 *  Array of cookie names or [$cookieName, $path] to clear on logout, stored in the session.
	 * @return {boolean} Whether logged in user id was changed.
	 */
	static function setLoggedInUser($user = null, $options = array())
	{
		if ($user && is_string($user)) {
			$user = Users_User::fetch($user, true);
		}
		$loggedInUserId = Q::ifset($_SESSION, 'Users', 'loggedInUser', 'id', null);
		if (Q::ifset($user, "id", null) === $loggedInUserId) {
			// This user is already the logged-in user. Do nothing.
			return false;
		}
		
		/**
		 * @event Users/setLoggedInUser {before}
		 * @param {Users_User} user
		 * @param {string} loggedInUserId
		 */
		Q::event('Users/setLoggedInUser', @compact('user', 'loggedInUserId'), 'before');
		
		if ($loggedInUserId) {
			// Always log out existing user, so their session data isn't carried over.
			// This also removes the devices for this session, stopping notifications.
			Users::logout();
		} else {
			// Otherwise the session data of the logged-out user is merged
			// into the logged-in user's session, so it can be used!
		}
		if (!$user) {
			// nothing more to do, this is essentially a call to log out
			return;
		}

		// Change the session id to prevent session fixation attacks
		if (empty($options['keepSessionId'])) {
			$duration = null;
			$session = new Users_Session();
			$session->id = Q_Session::id();
			if ($session->id and $session->retrieve()) {
				$duration = $session->duration;
			}
			$sessionId = Q_Session::regenerateId(true, $duration);
		}

		// Store the new information in the session
		$snf = Q_Config::get('Q', 'session', 'nonceField', 'nonce');
		$_SESSION['Users']['loggedInUser']['id'] = $user->id;
		Q_Session::setNonce();
		
		$user->sessionCount = isset($user->sessionCount)
			? $user->sessionCount + 1
			: 1;

		/**
		 * @event Users/setLoggedInUser/updateSessionId {before}
		 * @param {Users_User} user
		 */
		Q::event('Users/setLoggedInUser/updateSessionId', @compact('user'), 'before');
		
		$user->sessionId = $sessionId;
		$user->save(); // update sessionId in user
		
		/**
		 * @event Users/setLoggedInUser/updateSessionId {after}
		 * @param {Users_User} user
		 */
		Q::event('Users/setLoggedInUser/updateSessionId', @compact('user'), 'after');
		
		$votes = Users_Vote::select()
			->where(array(
				'userId' => $user->id,
				'forType' => 'Users/hinted'
			))->fetchDbRows(null, null, 'forId');
		
		// Cache already shown hints in the session.
		// The consistency of this mechanism across sessions is not perfect, i.e.
		// the same hint may repeat in multiple concurrent sessions, but it's ok.
		$_SESSION['Users']['hinted'] = array_keys($votes);

		if (!empty($options['cookiesToClearOnLogout'])) {
			foreach ($options['cookiesToClearOnLogout'] as $item) {
				$_SESSION['Users']['cookiesToClearOnLogout'][] = is_array($item) ? $item : array($item, null);
			}
		}
		
		if ($loggedInUserId) {
			// Set a notice for the user to alert them that the account has changed
			$template = Q_Config::expect('Users', 'login', 'notice');
			$displayName = $user->displayName();
			$html = Q_Handlebars::renderSource($template, @compact(
				'user', 'displayName'
			));
			Q_Response::setNotice('Users::setLoggedInUser', $html, array(
				'timeout' => Q_Config::get('Users', 'notices', 'timeout', 5)
			));
		}

		/**
		 * @event Users/setLoggedInUser {after}
		 * @param {Users_User} user
		 */
		Q::event('Users/setLoggedInUser', @compact('user'), 'after');
		self::$loggedOut = false;
		
		return true;
	}

	/**
	 * Registers a user in the system.
	 * @method register
	 * @static
	 * @param {string} $username The name of the user
	 * @param {string|array} $identifier Can be an email address or mobile number. Or it could be an array of $type => $info
	 * @param {string} [$identifier.identifier] an email address or phone number
	 * @param {array} [$identifier.device] an array with keys
	 *   "deviceId", "platform", "appId", "version", "formFactor"
	 *   to store in the Users_Device table for sending notifications
	 * @param {array} [$identifier.app] an array with "platform" key, and optional "appId"
	 * @param {array|string|true} [$icon=array()] By default, the user icon would be "default".
	 *  But you can pass here an array of filename => url pairs, or a gravatar url to
	 *  download the various sizes from gravatar. Finally, you can pass true to
	 *  generate an icon instead of using the default icon.
	 *  If $identifier['app']['platform'] is specified, and $icon is empty, then
	 *  an attempt will be made to download the icon from the user's account on the platform.
	 * @param {array} [$options=array()] An array of options that could include:
	 * @param {string} [$options.activation] The key under "Users"/"transactional" config to use for sending an activation message. Set to false to skip sending the activation message for some reason.
	 * @param {string} [$options.skipIdentifier=false] Whether skip empty identifier
	 * @return {Users_User}
	 * @throws {Q_Exception_WrongType} If identifier is not e-mail or modile
	 * @throws {Q_Exception} If user was already verified for someone else
	 * @throws {Users_Exception_AlreadyVerified} If user was already verified
	 * @throws {Users_Exception_UsernameExists} If username exists
	 */
	static function register(
		$username, 
		$identifier, 
		$icon = array(), 
		$options = array())
	{
		/**
		 * @event Users/register {before}
		 * @param {string} username
		 * @param {string|array} identifier
		 * @param {string} icon
		 * @param {string} platform
		 * @return {Users_User}
		 */
		$return = Q::event('Users/register', @compact('username', 'identifier', 'icon', 'platform', 'options'), 'before');
		if (isset($return)) {
			return $return;
		}

		$during = 'register';
		$platform = null;
		$appId = null;

		if (is_array($identifier)) {
			reset($identifier);
			switch (key($identifier)) {
				case 'app':
					$app = $identifier['app'];
					$fields = array('platform');
					Q_Valid::requireFields($fields, $app, true);
					$platform = $app['platform'];
					$appId = Q::ifset($app, 'appId', null);
					break;
				case 'device':
					$device = $identifier['device'];
					$fields = array('deviceId', 'platform', 'appId', 'version', 'formFactor');
					Q_Valid::requireFields($fields, $device, true);
					$identifier = Q::ifset($identifier, 'identifier', null);
					if (empty($device['platform'])) {
						throw new Q_Exception_RequiredField(array('field' => 'identifier.device.platform'));
					}
					$signedUpWith = $device['platform'];
					break;
				default:
					throw new Q_Exception_WrongType(array(
						'field' => 'identifier', 
						'type' => 'an array with entry named "device"'
					));
			}
		} else if (!$identifier && !Q::ifset($options, 'skipIdentifier', false)) {
			throw new Q_Exception_RequiredField(array('field' => 'identifier'));
		}
		$ui_identifier = null;
		if ($identifier) {
			if (Q_Valid::email($identifier, $emailAddress)) {
				$ui_identifier = $emailAddress;
				$key = 'email address';
				$signedUpWith = 'email';
			} else if (Q_Valid::phone($identifier, $mobileNumber)) {
				$ui_identifier = $mobileNumber;
				$key = 'mobile number';
				$signedUpWith = 'mobile';
			} else {
				throw new Q_Exception_WrongType(array(
					'field' => 'identifier',
					'type' => 'email address or mobile number'
				), array('emailAddress', 'mobileNumber'));
			}
		}

		$user = false;
		$inserting = true;
		if ($platform) {
			$platforms = Q_Config::get('Users', 'apps', 'platforms', array());
			if (!in_array($platform, $platforms)) {
				throw new Q_Exception_WrongValue(array(
					'field' => 'platform',
					'fieldpath' => 'One of the platforms named in Users/apps/platforms config'
				));
			}
			try {
				// authenticate (and possibly adopt) an existing platform user
				// or insert a new user during this authentication
				$user = Users::authenticate($platform, $appId, $authenticated, null);
			} catch (Exception $e) {

			}
			if ($user) {
				$inserting = false;
			}
			if ($user and $authenticated === 'adopted') {
				/**
				 * @event Users/adoptFutureUser {before}
				 * @param {Users_User} user
				 * @param {string} during
				 * @return {Users_User}
				 */
				$ret = Q::event('Users/adoptFutureUser', @compact('user', 'during'), 'before');
				if ($ret) {
					$user = $ret;
				}
			}
		}
		if (!$user) {
			$user = new Users_User(); // the user we will save in the database
		}
		if ($inserting and $ui_identifier) {
			// We will be inserting a new user into the database, so check if
			// this identifier was already verified for someone else.
			$ui = Users::identify($signedUpWith, $ui_identifier);
			if ($ui) {
				throw new Users_Exception_AlreadyVerified(@compact('key'), array(
					'emailAddress', 'mobileNumber', 'identifier'
				));
			}
		}
		$leaveDefaultIcon = Q_Config::get('Users', 'register', 'icon', 'leaveDefault', false);
		$user->set('leaveDefaultIcon', $leaveDefaultIcon);
		$usersRegisterIcon = Q::ifset($_SESSION, 'Users', 'register', 'icon', null);
		if (!is_array($icon) and $usersRegisterIcon) {
			$icon = $usersRegisterIcon;
			unset($_SESSION['Users']['register']['icon']);
			$user->set('skipIconSearch', $icon);
		}
		if (is_array($icon)) {
			$user->set('skipIconSearch', $icon);
		}

		Users::$cache['user'] = $user;

		if ($username) {
			if ( ! preg_match('/^[A-Za-z0-9\-_]+$/', $username)) {
				throw new Q_Exception_WrongType(array(
					'field' => 'username',
					'type' => 'valid username'
				), array('username'));
			}
		}
		
		// Insert a new user into the database, or simply modify an existing (adopted) user
		$user->id = Users_User::db()->uniqueId(Users_User::table(), 'id', null, array(
			'filter' => array('Users_User', 'idFilter')
		));
		$user->username = $username;
		if (!isset($user->signedUpWith) or $user->signedUpWith == 'none') {
			$user->signedUpWith = $signedUpWith;
		}
		$user->icon = is_string($icon) ? $icon : '{{Users}}/img/icons/default';
		$user->passphraseHash = '';
		$url_parts = parse_url(Q_Request::baseUrl());
		if (isset($url_parts['host'])) {
			// By default, the user's url would be this:
			$user->url = "http://".$user->id.'.'.$url_parts['host'];
		}
		/**
		 * @event Users/insertUser {before}
		 * @param {string} during
		 * @param {Users_User} user
		 */
		Q::event('Users/insertUser', @compact('user', 'during'), 'before');

		// the following code could throw exceptions
		if (empty($user->emailAddress) and empty($user->mobileNumber)
			and ($signedUpWith === 'email' or $signedUpWith === 'mobile')) {
			// Add an email address or mobile number to the user, that they'll have to verify
			$activation = Q::ifset($options, 'activation', 'activation');
			if ($activation) {
				$subject = Q_Config::get('Users', 'transactional', $activation, "subject", null);
				$body = Q_Config::get('Users', 'transactional', $activation, "body", null);
			} else {
				$subject = $body = null;
			}
			if ($signedUpWith === 'email') {
				$user->addEmail($identifier, $subject, $body, array(), $options);
			} else if ($signedUpWith === 'mobile') {
				$p = $options;
				if ($delay = Q_Config::get('Users', 'register', 'delaySms', 0)) {
					$p['delay'] = $delay;
				}
				$sms = Q_Config::get('Users', 'transactional', $activation, "sms", null);
				$user->addMobile($mobileNumber, $sms, array(), $p);
			}
		}
		if (!empty($device)) {
			$device['userId'] = $user->id;
			Users_Device::add($device);
		}

		$user->save(); // saves the user with the id

		/**
		 * @event Users/insertUser {after}
		 * @param {string} during
		 * @param {Users_User} user
		 */
		Q::event('Users/insertUser', @compact('user', 'during'), 'after');

		$directory = null;
		$sizes = array_keys(Q_Image::getSizes('Users/icon'));
		sort($sizes);
		if (empty($icon)) {
			if ($externalFrom = Users_ExternalFrom::authenticate($platform, $appId)) {
				$icon = $externalFrom->icon($sizes, '.png');
			}
		} else {
			// Import the user's icon and save it
			if (is_string($icon)) {
				// assume it's from gravatar
				$iconString = $icon;
				$icon = array();
				foreach ($sizes as $size) {
					$icon["$size.png"] = "$iconString&s=$size";
				}
			} else if ($icon === true) {				
				// locally generated icons
				$identifier = $identifier ? $identifier : microtime();
				$hash = md5(strtolower(trim($identifier)));
				$icon = array();
				foreach ($sizes as $size) {
					$icon["$size.png"] = array('hash' => $hash, 'size' => $size);
				}
				$app = Q::app();
				$directory = APP_FILES_DIR.DS.$app.DS.'uploads'.DS.'Users'
					.DS.Q_Utils::splitId($user->id).DS.'icon'.DS.'generated';
			}
		}
		if (!$leaveDefaultIcon and !Users::isCustomIcon($user->icon)) {
			self::importIcon($user, $icon, $directory);
			$user->save();
		}

		/**
		 * @event Users/register {after}
		 * @param {string} username
		 * @param {string|array} identifier
		 * @param {string} icon
		 * @param {Users_User} user
		 * @param {string} platform
		 * @return {Users_User}
		 */
		$return = Q::event('Users/register', @compact(
			'username', 'identifier', 'icon', 'user', 'platform', 'options', 'device'
		), 'after');
		
		return $return ? $return : $user;
	}

	/**
	 * Returns a user in the database that corresponds to the contact info, if any.
	 * @method userFromContactInfo
	 * @static
	 * @param {string} $type can be "email", "mobile", "$platform_$appId",
	 *  or any of the above with optional "_hashed" suffix to indicate
	 *  that the value has already been hashed.
	 * @param {string} $value The value corresponding to the type. If $type is
	 *
	 * * "email" - this is one of the user's email addresses
	 * * "mobile" - this is one of the user's mobile numbers
	 * * "email_hashed" - this is the standard hash of the user's email address
	 * * "mobile_hashed" - this is the standard hash of the user's mobile number
	 * * $platform - this is the user's id on that platform
	 * @return {Users_User|null}
	 */
	static function userFromContactInfo($type, $value)
	{
		$ui = Users::identify($type, $value, null, $normalized);
		if (!$ui) {
			return null;
		}
		$user = new Users_User();
		$user->id = $ui->userId;
		if (!$user->retrieve()) {
			return null;
		}
		$user->set('identify', $ui);
		return $user;
	}
	
	/**
	 * Determines whether the identifier is an email address or mobile number
	 * @method identifierType
	 * @static
	 * @param {string} $identifier The identifier
	 * @param {&string} [$normalized=null] Will be filled with the string representing the normalized
	 *   email address or mobile number
	 * @return {string} The identifier type, either "mobile", "email", or null if neither
	 * @throws {Q_Exception_WrongType} if the identifier is not a valid email or phone number
	 */
	static function identifierType($identifier, &$normalized = null)
	{
		$identifierType = null;
		if (Q_Valid::email($identifier, $normalized)) {
			$identifierType = 'email';
		} else if (Q_Valid::phone($identifier, $normalized)) {
			$identifierType = 'mobile';
		}
		return $identifierType;
	}

	/**
	 * Returns Users_Identifier rows that correspond to the identifier in the database, if any.
	 * @method identify
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
	static function identify($type, $value, $state = 'verified', &$normalized=null)
	{
		$type = Q_Utils::normalize($type);
		$identifiers = array();
		$expected_array = is_array($type);
		$types = is_array($type) ? $type : array($type => $value);
		foreach ($types as $type => $value) {
			list($hashed, $ui_type) = self::hashing($value, $type);
			$identifiers[] = "$ui_type:$hashed";
		}
		$uis = Users_Identify::select()->where(array(
			'identifier' => $identifiers,
			'state' => isset($state) ? $state : array('verified', 'future')
		))->limit(1)->fetchDbRows();
		if ($expected_array) {
			return $uis;
		}
		return !empty($uis) ? reset($uis) : null;
	}

	/**
	 * Returns a user in the database that will correspond to a new user in the future
	 * once they authenticate or follow an invite.
	 * Inserts a new user if one doesn't already exist.
	 *
	 * @method futureUser
	 * @param {string} $type can be "email", "mobile", 
	 *  a string of the form $platform."_".$appId"
	 *  or any of the above with optional "_hashed" suffix to indicate
	 *  that the value has already been hashed.
	 * @param {string} $value The value corresponding to the type. The type
	 *  can be "email", "mobile", the name of a platform, or any of the above
	 *  with optional "_hashed" suffix to indicate that the value has already been hashed.
	 *  It can also be "none", in which case the type is ignored, no "identify" rows are
	 *  inserted into the database at this time. Later, as the user adds an email address
	 *  or platform xids, they will be inserted.
	 * <br><br>
	 * NOTE: If the person we are representing here comes and registers the regular way,
	 * and then later adds an email, mobile, or authenticates with a platform,
	 * which happens to match the "future" mapping we inserted in users_identify table, 
	 * then this futureUser will not be converted, since they already registered
	 * a different user. Later on, we may have some sort function to merge users together. 
	 *
	 * @param {&string} [$status=null] The status of the user - 'verified' or 'future'
	 * @return {Users_User}
	 * @throws {Q_Exception_WrongType} If $type is not supported
	 * @throws {Q_Exception_MissingRow} If identity for user exists but user does not exists
	 */
	static function futureUser($type, $value, &$status = null)
	{
		if ($type !== 'none') {
			$ui = Users::identify($type, $value, null);
			if ($ui && !empty($ui->userId)) {
				$user = new Users_User();
				$user->id = $ui->userId;
				if ($user->retrieve()) {
					$status = $ui->state;
					return $user;
				} else {
					$userId = $ui->userId;
					throw new Q_Exception_MissingRow(array(
						'table' => 'user',
						'criteria' => 'that id'
					), 'userId');
				}
			}
		}

		// Make a user row to represent a "future" user and give them an empty username
		$user = new Users_User();
		$user->signedUpWith = 'none'; // this marks it as a future user for now
		$user->username = "";
		$user->icon = '{{Users}}/img/icons/future';
		if ($type === 'email') {
			$user->emailAddressPending = $value;
			$user->save();
		} else if ($type === 'mobile') {
			$user->mobileNumberPending = $value;
			$user->save();
		} else if (substr($type, -7) !== '_hashed') {
			$user->setXid($type, $value, true);
		}
		$during = 'future';
		/**
		 * @event Users/insertUser {before}
		 * @param {string} during
		 * @param {Users_User} 'user'
		 */
		Q::event('Users/insertUser', @compact('user', 'during'), 'before');
		$user->save(); // sets the user's id
		/**
		 * @event Users/insertUser {after}
		 * @param {string} during
		 * @param {Users_User} user
		 */
		Q::event('Users/insertUser', @compact('user', 'during'), 'after');

		if ($type != 'email' and $type != 'mobile') {
			if ($type !== 'none') {
				// Save an identifier => user pair for this future user
				$ui = new Users_Identify();
				$ui->identifier = "$type:$value";
				$ui->state = 'future';
				if (!$ui->retrieve()) {
					$ui->userId = $user->id;
					$ui->save();
				}
				$status = $ui->state;
			} else {
				$status = 'future';
			}
		} else {
			// Find existing identifier or save a new one
			$ui = new Users_Identify();
			list($hashed, $ui_type) = self::hashing($value, $type);
			$hashed = Q_Utils::hash($value);
			$ui->identifier = "$ui_type:$hashed";
			$ui->state = 'future';
			if (!$ui->retrieve()) {
				$ui->userId = $user->id;
				$ui->save(true);
			}
			$status = $ui->state;
		}
		return $user;
	}

	/**
	 * Imports an icon and sets $user->icon to the url.
	 * @method importIcon
	 * @static
	 * @param {object} $obj An object with "icon" property, for whom the icon should be downloaded
	 * @param {array} [$urls=array()] Array of $basename => $url to download from, or
	 *   of $basename => arrays("hash"=>..., "size"=>...) for gravatar icons.
	 * @param {string} [$directory=null] Set this unless $obj is a Users_User, in which case it will
	 *   defaults to APP/files/APP/uploads/Users/USERID/icon/imported
	 * @param {string|array} [$cookies=null] The cookies to pass, if downloading from URLs
	 * @return {string} the path to the icon directory, or false if files weren't created
	 */
	static function importIcon($obj, $urls = array(), $directory = null, $cookies = null)
	{
		$app = Q::app();
		if (empty($directory)) {
			$directory = APP_FILES_DIR.DS.$app.DS.'uploads'.DS.'Users'
				.DS.Q_Utils::splitId($obj->id).DS.'icon'.DS.'imported';
		}
		if (empty($urls)) {
			return $directory;
		}
		Q_Utils::canWriteToPath($directory, null, true);
		$largestWidth = 0;
		$largestHeight = 0;
		$largestUrl = null;
		$largestCookie = null;
		$largestImage = null;
		$o = array();
		// get image with largest width and height at the same time
		foreach ($urls as $basename => $url) {
			if (!is_string($url)) continue;
			$filename = $directory.DS.$basename;
			$info = pathinfo($filename);
			$parts = explode('x', $info['filename']);
			if (count($parts) === 1) {
				$width = $height = $parts[0];
			} else if (!$parts[0]) {
				$width = $height = $parts[1];
			} else if (!$parts[1]) {
				$width = $height = $parts[0];
			}
			if ($largestWidth < (int)$width
			and $largestHeight < (int)$height) {
				$largestWidth = (int)$width;
				$largestHeight = (int)$height;
				$largestUrl = $url;
				$largestCookie = is_string($cookies) ? $cookies : Q::ifset($cookies, $basename, null);
				$o = $largestCookie ? array("cookie: $largestCookie") : array();
			}
		}
		if ($largestUrl) {
			if (Q_Valid::url($largestUrl)) {
				$data = Q_Utils::get($largestUrl, null, true, $o);
			} else {
				$data = file_get_contents($largestUrl);
			}
			if (pathinfo($url, PATHINFO_EXTENSION) == 'ico') {
				require USERS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';
				$icoFileService = new Elphin\IcoFileLoader\IcoFileService;
				$largestImage = $icoFileService->extractIcon($data, 32, 32);
			} else {
				$largestImage = @imagecreatefromstring($data);
			}

			if ($largestImage) {
				$sw = imagesx($largestImage);
				$sh = imagesy($largestImage);
			}
		}
		foreach ($urls as $basename => $url) {
			$filename = $directory.DS.$basename;
			if (is_string($url)) {
				$info = pathinfo($filename);
				if ($largestImage) {
					$source = $largestImage;
				} else {
					$cookie = is_string($cookies) ? $cookies : Q::ifset($cookies, $basename, null);
					$o = $cookie ? array("cookie: $largestCookie") : array();
					if (Q_Valid::url($url)) {
						$data = Q_Utils::get($url, null, true, $o);
					} else {
						$data = file_get_contents($url);
					}
					if (pathinfo($url, PATHINFO_EXTENSION) == 'ico') {
						require USERS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';
						$icoFileService = new Elphin\IcoFileLoader\IcoFileService;
						$source = $icoFileService->extractIcon($data, 32, 32);
					} else {
						$source = imagecreatefromstring($data);
					}
					$sw = imagesx($source);
					$sh = imagesy($source);
				}
				$parts = explode('x', $info['filename']);
				if (count($parts) === 1) {
					$w = $h = $parts[0];
				} else {
					if (!$parts[0] and $parts[1]) {
						$w = $sw;
						$h = $sh;
					} else if (!$parts[0]) {
						$h = $parts[1];
						$w = $h / $sh * $sw;
					} else if (!$parts[1]) {
						$w = $parts[0];
						$h = $w / $sw * $sh;
					}
				}
				if ($sw == $w and $sh == $h) {
					$image = $largestImage;
				} else {
					$min = min($sw / $w, $sh / $h);
					$w2 = $w * $min;
					$h2 = $h * $min;
					$sx = round(($sw - $w2) / 2);
					$sy = round(($sh - $h2) / 2);
					$image = imagecreatetruecolor($w, $h);
					imagealphablending($image, false);
					imagecopyresampled($image, $source, 0, 0, $sx, $sy, $w, $h, $w2, $h2);
				}
				$info = pathinfo($filename);
				switch ($info['extension']) {
					case 'png':
						$func = 'imagepng';
						imagesavealpha($image, true);
						imagealphablending($image, true);
						break;
					case 'jpg':
					case 'jpeg':
						$func = 'imagejpeg';
						break;
					case 'gif':
						$func = 'imagegif';
						break;
				}
				call_user_func($func, $image, $directory.DS.$info['filename'].'.png');
			} else {
				$type = Q_Config::get('Users', 'login', 'iconType', 'wavatar');
				$gravatar = Q_Config::get('Users', 'login', 'gravatar', false);
				$data = Q_Image::avatar($url['hash'], $url['size'], $type, $gravatar);
				if ($gravatar) {
					file_put_contents($filename, $data); // downloaded				
				} else {
					imagepng($data, $filename); // locally generated
				}
			}
			if (!file_exists($filename)) {
				return null;
			}
		}
		$head = APP_FILES_DIR.DS.$app.DS.'uploads';
		$tail = str_replace(DS, '/', substr($directory, strlen($head)));
		$obj->icon = '{{baseUrl}}/Q/uploads'.$tail;
		return $directory;
	}

	/**
	 * Hashes a passphrase
	 * @method hashPassphrase
	 * @static
	 * @param {string} $passphrase the passphrase to hash
	 * @return {string} the hashed passphrase, or "" if the passphrase was ""
	 */
	static function hashPassphrase ($passphrase)
	{
		if ($passphrase === '') {
			return '';
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
	 * @method hashPassphrase
	 * @static
	 * @param {string} $passphrase the passphrase to hash
	 * @param {string} $existing_hash the hash that is was previously generated
	 * @return {boolean} whether the password is verified to be correct, or not
	 */
	static function verifyPassphrase ($passphrase, $existing_hash)
	{
		return password_verify($passphrase, $existing_hash);
	}
	
	/**
	 * Get the internal app id and info
	 * @method appId
	 * @static
	 * @param {string} $platform The platform or platform for the app
	 * @param {string} [$appId=Q::app()] Can be either an internal or external app id
	 * @param {boolean} [$throwIfMissing=false] Whether to throw an exception if missing
	 * @return {array} Returns array($appId, $appInfo) where $appId is internal app id
	 * @throws Q_Exception_MissingConfig
	 */
	static function appInfo($platform, $appId = null, $throwIfMissing = false)
	{
		if ($appId === null) {
			$appId = Q::app();
		}
		$apps = Q_Config::get('Users', 'apps', $platform, array());
		$id = $appId;
		if (isset($apps[$id])) {
			$appInfo = $apps[$id];
		} else {
			$id = $appInfo = null;
			foreach ($apps as $k => $v) {
				if (!empty($v['appId'])
				&& $v['appId'] === $appId) {
					$appInfo = $v;
					$id = $k;
					break;
				}
			}
		}
		if ($throwIfMissing and !isset($id)) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "Users/apps/$platform/$appId"
			));
		}
		if (!empty($apps['*'])) {
			// tree-merge over default values
			$tree = new Q_Tree($apps['*']);
			$tree->merge($appInfo);
			$appInfo = $tree->getAll();
		}
		return array($id, $appInfo);
	}

	/**
	 * Adds a link to someone who is not yet a user
	 * @method addLink
	 * @static
	 * @param {string} $address Could be email address, mobile number, etc.
	 * @param {string} [$type=null] can be "email", "mobile", "$platform/t$appId",
	 *  or any of the above with optional "_hashed" suffix to indicate
	 *  that the value has already been hashed.
	 *  If null, the function tries to guess the $type by using Q_Valid functions.
	 * @param {array} [$extraInfo=array()] Associative array of information you have imported
	 * from the address book. Should contain at least the keys:
	 *
	 * * "firstName" => the imported first name
	 * * "lastName" => the imported last name
	 * * "labels" => array of the imported names of the contact groups to add this user to once they sign up
	 *
	 * @return {boolean|integer} Returns true if the link row was created
	 * Or returns a string $userId if user already exists and has verified this address.
	 * @throws {Q_Exception_WrongValue} If $address is not a valid id
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function addLink(
		$address,
		$type = null,
		$extraInfo = array())
	{
		list($hashed, $ui_type) = self::hashing($address, $type);

		$user = Users::loggedInUser(true);

		// Check if the contact user already exists, and if so, add a contact instead of a link
		$ui = Users::identify($ui_type, $address);
		if ($ui) {
			// Add a contact instead of a link
			$user->addContact($ui->userId, Q::ifset($extraInfo, 'labels', null));
			return $user->id;
		}

		// Add a link if one isn't already there
		$link = new Users_Link();
		$link->identifier = "$ui_type:$hashed";
		$link->userId = $user->id;
		if ($link->retrieve()) {
			return false;
		}
		$link->extraInfo = Q::json_encode($extraInfo);
		$link->save();
		return true;
	}

	/**
	 * @method links
	 * @static
	 * @param {array} $contactInfo An array of key => value pairs, where keys
	 *  can be "email", "mobile", the name of a platform, or any of the above
	 *  with optional "_hashed" suffix to indicate that the value has already been hashed.
	 * @return {array}
	 *  Returns an array of all links to this user's contact info
	 */
	static function links($contactInfo)
	{
		$links = array();
		$identifiers = array();
		foreach ($contactInfo as $k => $v) {
			list($hashed, $ui_type) = self::hashing($v, $k);
			$identifiers[] = "$ui_type:$hashed";
		}
		return Users_Link::select()->where(array(
			'identifier' => $identifiers
		))->fetchDbRows();
	}

	/**
	 * Inserts some Users_Contact rows for the locally registered users
	 * who have added links to this particular contact information.
	 * Removes the links after successfully adding the Users_Contact rows.
	 * @method saveContactsFromLinks
	 * @static
	 * @param {array} $contactInfo An array of key => value pairs, where keys
	 *  can be "email", "mobile", the name of a platform, or any of the above
	 *  with optional "_hashed" suffix to indicate that the value has already been hashed.
	 * @param {string} $userId The id of the user who has verified these identifiers
	 * @throws {Users_Exception_NoSuchUser} if the user wasn't found in the database
	 */
	static function saveContactsFromLinks($contactInfo, $userId)
	{
		/**
		 * @event Users/saveContactsFromLinks {before}
		 */
		Q::event('Users/saveContactsFromLinks', array(), 'before');

		$user = Users_User::fetch($userId, true);
		$links = $contactInfo
			? Users::links($contactInfo)
			: array();

		$contacts = array();
		foreach ($links as $link) {
			$extraInfo = Q::json_decode($link->extraInfo, true);
			$firstName = Q::ifset($extraInfo, 'firstName', '');
			$lastName = Q::ifset($extraInfo, 'lastName', '');
			$fullName = $firstName
				? ($lastName ? "$firstName $lastName" : $firstName)
				: ($lastName ? $lastName : "");
			if (!empty($extraInfo['labels']) and is_array($extraInfo['labels'])) {
				foreach ($extraInfo['labels'] as $label) {
					// Insert the contacts one by one, so if an error occurs
					// we can continue right on inserting the rest.
					$contact = new Users_Contact();
					$contact->userId = $link->userId;
					$contact->contactUserId = $user->id;
					$contact->label = $label;
					$contact->nickname = $fullName;
					$contact->save(true);
					$link->remove(); // we don't need this link anymore

					// TODO: Think about porting this to Node
					// and setting a flag when done.
					// Perhaps we should send a custom message through socket.io
					// which would cause Users.js to add a notice to the interface
				}
			}
		}
		/**
		 * @event Users/saveContactsFromLinks {after}
		 * @param {array} contacts
		 */
		Q::event('Users/saveContactsFromLinks', @compact('contacts'), 'after');

		// TODO: Add a handler to this event in the Streams plugin, so that
		// we post this information to a stream on the hub, which will
		// update all its subscribers, who will also run saveContactsFromLinks
		// for their local users.
	}

	/**
	 * Get the email address or mobile number from the request, if it can be deduced.
	 * Note: it should still be tested for validity.
	 * @method requestedIdentifier
	 * @static
	 * @param {&string} [$type=null] The identifier's type will be filled here. Might be "email", "mobile", "facebook" etc.
	 * @return {string|null} The identifier, or null if one wasn't requested
	 */
	static function requestedIdentifier(&$type = null)
	{
		$identifier = null;
		$type = null;
		if (!empty($_REQUEST['identifier'])) {
			$identifier = $_REQUEST['identifier'];
			if (isset($identifier['app']['platform'])) {
				$type = $identifier['app']['platform'];
				$identifier = Q::ifset($identifier, 'identifier', null);
			} else if (Q_Valid::email($identifier, $normalized)) {
				$type = 'email';
			} else if (Q_Valid::phone($identifier, $normalized)) {
				$type = 'mobile';
			}
		}
		if (!empty($_REQUEST['emailAddress'])) {
			$identifier = $_REQUEST['emailAddress'];
			Q_Valid::email($identifier, $normalized);
			$type = 'email';
		}
		if (!empty($_REQUEST['mobileNumber'])) {
			$identifier = $_REQUEST['mobileNumber'];
			Q_Valid::phone($identifier, $normalized);
			$type = 'mobile';
		}
		return isset($normalized) ? $normalized : $identifier;
	}

	static function termsLabel($for = 'register')
	{
		$terms_uri = Q_Config::get('Users', $for, 'terms', 'uri', null);
		$terms_label = Q_Config::get('Users', $for, 'terms', 'label', null);
		$terms_title = Q_Config::get('Users', $for, 'terms', 'title', null);
		if (!$terms_uri or !$terms_title or !$terms_label) {
			return null;
		}
		$terms_link = Q_Html::a(
			Q::interpolate($terms_uri, array('baseUrl' => Q_Request::baseUrl())),
			array('target' => '_blank'),
			Q::text($terms_title)
		);
		return Q::interpolate($terms_label, array('link' => $terms_link));
	}
	
	/**
	 * Get the url of a user's icon
	 * @param {string} [$icon] The contents of a user row's icon field
	 * @param {string|false} [$basename=null] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
	 * @return {string} The stream's icon url
	 */
	static function iconUrl($icon, $basename = null)
	{
		if (empty($icon)) {
			return '';
		}
		$url = Q_Uri::interpolateUrl($icon);
		$url = (Q_Valid::url($url) or mb_substr($icon, 0, 2) === '{{') 
			? $url 
			: "{{Users}}/img/icons/$url";
		$baseUrl = Q_Request::baseUrl();
		$themedUrl = Q_Html::themedUrl($url);
		if ($basename !== false && Q::startsWith($themedUrl, $baseUrl)) {
			if ($basename === null or $basename === true) {
				$basename = '40';
			}
			if (strpos($basename, '.') === false) {
				$basename .= ".png";
			}
			$url .= "/$basename";
			return Q_Html::themedUrl($url);
		}
		return $themedUrl;
	}
	
	/**
	 * Checks whether one user can manage contacts of another user
	 * @static
	 * @param {string} $asUserId The user who would be doing the managing
	 * @param {string} $userId The user whose contacts they are
	 * @param {string} $label The label of the contacts that will be managed
	 * @param {boolean} [$throwIfNotAuthorized=false] Throw an exception if not authorized
	 * @param {boolean} [$readOnly=false] Whether we just want to know if the user can view the labels
	 * @return {boolean} Whether a contact with this label is allowed to be managed
	 * @throws {Users_Exception_NotAuthorized}
	 */
	static function canManageContacts(
		$asUserId, 
		$userId, 
		$label, 
		$throwIfNotAuthorized = false,
		$readOnly = false
	) {
		if ($asUserId === false) {
			return true;
		}
		if (!isset($asUserId)) {
			$user = Users::loggedInUser();
			$asUserId = $user ? $user->id : '';
		}
		$authorized = false;
		$result = Q::event(
			"Users/canManageContacts",
			@compact('asUserId', 'userId', 'label', 'throwIfNotAuthorized', 'readOnly'),
			'before'
		);
		if ($result) {
			$authorized = $result;
		} else if ($asUserId === $userId) {
			if ($readOnly or substr($label, 0, 6) === 'Users/') {
				$authorized = true;
			}
		}
		if (!$authorized and $throwIfNotAuthorized) {
			throw new Users_Exception_NotAuthorized();
		}
		return $authorized;
	}
	
	/**
	 * Checks whether one user can manage contact labels of another user
	 * @static
	 * @param {string} $asUserId The user who would be doing the managing
	 * @param {string} $userId The user whose contact labels they are
	 * @param {string} $label The label that will be managed
	 * @param {boolean} $throwIfNotAuthorized Throw an exception if not authorized
	 * @param {boolean} $readOnly Whether we just want to know if the user can view the labels
	 * @return {boolean} Whether this label is allowed to be managed
	 * @throws {Users_Exception_NotAuthorized}
	 */
	static function canManageLabels(
		$asUserId, 
		$userId, 
		$label, 
		$throwIfNotAuthorized = false,
		$readOnly = false
	) {
		if ($asUserId === false) {
			return true;
		}
		$authorized = false;
		$result = Q::event(
			"Users/canManageLabels",
			@compact('asUserId', 'userId', 'label', 'throwIfNotAuthorized', 'readOnly'),
			'before'
		);
		if ($result) {
			$authorized = $result;
		} else if ($asUserId === $userId) {
			if ($readOnly or substr($label, 0, 6) === 'Users/') {
				$authorized = true;
			}
		}
		if (!$authorized and $throwIfNotAuthorized) {
			throw new Users_Exception_NotAuthorized();
		}
		return $authorized;
	}
	
	/**
	 * Get the capability object that will be sent in "Q.plugins.Users.capability" 
	 * It will be signed and used in some requests.
	 * @method capability
	 * @static
	 * @return Q_Capability
	 */
	static function capability()
	{
		static $c = null;
		if (!isset($c)) {
			$duration = Q_Config::expect('Users', 'capability', 'duration');
			$time = time();
			$c = new Q_Capability(array(), $time, $time + $duration);
		}
		return $c;
	}
	
	protected static function hashing($identifier, $type = null)
	{
		// process the address first
		$identifier = trim($identifier);
		if (substr($type, -7) === '_hashed') {
			$hashed = $identifier;
			$ui_type = $type;
		} else {
			$type = str_replace("\t", "_", $type); // backwards compatibility
			$parts = explode("_", $type);
			switch ($parts[0]) {
				case 'email':
					if (!Q_Valid::email($identifier, $normalized)) {
						throw new Q_Exception_WrongValue(
							array('field' => 'identifier', 'range' => 'email address')
						);
					}
					break;
				case 'mobile':
					if (!Q_Valid::phone($identifier, $normalized)) {
						throw new Q_Exception_WrongValue(
							array('field' => 'identifier', 'range' => 'phone number')
						);
					}
					break;
				case 'facebook':
				case 'twitter':
					if (!is_numeric($identifier)) {
						throw new Q_Exception_WrongValue(
							array('field' => 'address', 'range' => 'numeric xid')
						);
					}
					$normalized = $identifier;
					break;
				case 'ios':
				case 'android':
				case 'web3':
					if (!is_string($identifier)) {
						throw new Q_Exception_WrongValue(
							array('field' => 'identifier', 'range' => 'string xid')
						);
					}
					$normalized = $identifier;
					break;
				default:
					$normalized = Q_Utils::normalize($identifier);
					break;
			}
			$hashed = Q_Utils::hash($normalized);
			$ui_type = $type.'_hashed';
		}
		return array($hashed, $ui_type, substr($ui_type, 0, -7));
	}

	/**
	 * @property $loggedOut
	 * @type boolean
	 */
	public static $loggedOut;
	/**
	 * @property $cache
	 * @type array
	 * @default array()
	 */
	public static $cache = array();

	/* * * */
};

include_once(__DIR__.DS."Facebook".DS."polyfills.php");
