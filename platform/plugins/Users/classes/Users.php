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
	 * The facebook object that would be instantiated
	 * during the "Q/objects" event, if the request
	 * warrants it.
	 * @property $facebook
	 * @type Facebook
	 * @static
	 */
	static $facebook = null;

	/**
	 * Facebook objects that would be instantiated
	 * from cookies during the "Q/objects" event,
	 * if there are cookies for them.
	 * @property $facebooks
	 * @type array
	 * @static
	 */
	static $facebooks = array();
	
	/**
	 * Get the id of the main community from the config. Defaults to the app name.
	 * @return {string} The id of the main community for the installed app.
	 */
	static function communityId()
	{
		$communityId = Q_Config::get('Users', 'community', 'id', null);
		return $communityId ? $communityId : Q_Config::expect('Q', 'app');
	}
	
	/**
	 * Get the name of the main community from the config. Defaults to the app name.
	 * @return {string} The name of the main community for the installed app.
	 */
	static function communityName()
	{
		$communityName = Q_Config::get('Users', 'community', 'name', null);
		return $communityName ? $communityName : Q_Config::expect('Q', 'app');
	}

	/**
	 * @param string [$publisherId] The id of the publisher relative to whom to calculate the roles. Defaults to the app name.
	 * @param {string|array|Db_Expression} [$filter=null] 
	 *  You can pass additional criteria here for the label field
	 *  in the `Users_Contact::select`, such as an array or Db_Range
	 * @param {array} [$options=array()] Any additional options to pass to the query, such as "ignoreCache"
	 * @param {string} [$userId=null] If not passed, the logged in user is used, if any
	 * @return {array} An associative array of $roleName => $contactRow pairs
	 * @throws {Users_Exception_NotLoggedIn}
	 */
	static function roles($publisherId = null, $filter = null, $options = array(), $userId = null)
	{
		if (empty($publisherId)) {
			$publisherId = Users::communityId();
		}
		if (!isset($userId)) {
			$user = Users::loggedInUser();
			if (!$user) {
				return array();
			}
			$userId = $user->id;
		}
		$contacts = Users_Contact::select('*')
			->where(array(
				'userId' => $publisherId,
				'contactUserId' => $userId
			))->andWhere($filter ? array('label' => $filter) : null)
			->options($options)
			->fetchDbRows(null, null, 'label');
		return $contacts;
	}

	/**
	 * @method oAuth
	 * @static
	 * @param {string} $provider Currently only supports the value "facebook".
	 * @return {Zend_Oauth_Client}
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function oAuth($provider)
	{
		$nativeuser = self::loggedInUser();

		if(!$nativeuser)
			throw new Users_Exception_NotLoggedIn();

		#Set up oauth options
		$oauthOptions = Q_Config::expect('Users', 'oAuthProviders', $provider, 'oAuth');
		$customOptions = Q_Config::get('Users', 'oAuthProviders', $provider, 'custom', null);

		#If the user already has a token in our DB:
		$appuser = new Users_AppUser();
		$appuser->userId = $nativeuser->id;
		$appuser->provider = $provider;
		$appuser->appId = Q_Config::expect('Users', 'oAuthProviders', $provider, 'appId');

		if($appuser->retrieve('*', true))
		{
				$zt = new Zend_Oauth_Token_Access();
				$zt->setToken($appuser->access_token);
				$zt->setTokenSecret($appuser->session_secret);

				return $zt->getHttpClient($oauthOptions);
		}

		#Otherwise, obtain a token from provider:
		$consumer = new Zend_Oauth_Consumer($oauthOptions);

		if(isset($_GET['oauth_token']) && isset($_SESSION[$provider.'_request_token'])) //it's a redirect back from google
		{
			$token = $consumer->getAccessToken($_GET, unserialize($_SESSION[$provider.'_request_token']));

			$_SESSION[$provider.'_access_token'] = serialize($token);
			$_SESSION[$provider.'_request_token'] = null;

			#Save tokens to database
			$appuser->access_token = $token->getToken();
			$appuser->session_secret = $token->getTokenSecret();
			$appuser->save();

			return $token->getHttpClient($oauthOptions);
		}
		else //it's initial pop-up load
		{
			$token = $consumer->getRequestToken($customOptions);

			$_SESSION[$provider.'_request_token'] = serialize($token);

			$consumer->redirect();

			return null;
		}

	}

	/**
	 * @method oAuthClear
	 * @static
	 * @param {string} $provider Currently only supports the value "facebook".
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function oAuthClear($provider)
	{
		$nativeuser = self::loggedInUser();

		if(!$nativeuser)
			throw new Users_Exception_NotLoggedIn();

		$appuser = new Users_AppUser();
		$appuser->userId = $nativeuser->id;
		$appuser->provider = $provider;
		$appuser->appId = Q_Config::expect('Users', 'oAuthProviders', $provider, 'appId');
		$appuser->remove();
	}

	/**
	 * Retrieves the currently logged-in user from the session.
	 * If the user was not originally retrieved from the database,
	 * inserts a new one.
	 * Thus, this can also be used to turn visitors into registered
	 * users.
	 * @method authenticate
	 * @static
	 * @param {string} $provider Currently only supports the value "facebook".
	 * @param {integer} [$appId=null] The id of the app within the specified provider.
	 *  Used for storing app-specific session information.
	 * @param {&boolean} [$authenticated=null] If authentication fails, puts false here.
	 *  Otherwise, puts one of the following:
	 *  'registered' if user just registered,
	 *  'adopted' if a futureUser was just adopted,
	 *  'connected' if a logged-in user just connected the provider account for the first time,
	 *  'authorized' if a logged-in user was connected to provider but just authorized this app for the first time
	 *  or true otherwise.
	 * @param {boolean} [$import_emailAddress=false] If true, and the user's email address is not set yet,
	 *  imports the email address from the provider if it is available,
	 *  and sets it as the user's email address without requiring verification.
	 * @return {Users_User}
	 */
	static function authenticate(
		$provider,
		$appId = null,
		&$authenticated = null,
		$import_emailAddress = false)
	{
		if (!isset($appId)) {
			$app = Q_Config::expect('Q', 'app');
			$appId = Q_Config::expect('Users', 'facebookApps', $app, 'appId');
		}
		$authenticated = null;

		$during = 'authenticate';

		$return = null;
		/**
		 * @event Users/authenticate {before}
		 * @param {string} provider
		 * @param {string} appId
		 * @return {Users_User}
		 */
		$return = Q::event('Users/authenticate', compact('provider', 'appId'), 'before');
		if (isset($return)) {
			return $return;
		}

		if (!isset($provider) or $provider != 'facebook') {
			throw new Q_Exception_WrongType(array('field' => 'provider', 'type' => '"facebook"'));
		}

		if (!isset($appId)) {
			throw new Q_Exception_WrongType(array('field' => 'appId', 'type' => 'a valid facebook app id'));
		}

		Q_Session::start();

		// First, see if we've already logged in somehow
		if ($user = self::loggedInUser()) {
			// Get logged in user from session
			$user_was_logged_in = true;
			$retrieved = true;
		} else {
			// Get an existing user or create a new one
			$user_was_logged_in = false;
			$retrieved = false;
			$user = new Users_User();
		}
		$authenticated = false;
		$emailAddress = null;

		// Try authenticating the user with the specified provider
		switch ($provider) {
		case 'facebook':
			$facebook = Users::facebook($appId);
			if (!$facebook or !$facebook->getUser()) {
				// no facebook authentication is happening
				return $user_was_logged_in ? $user : false;
			}
			if (empty($user->emailAddress)) {
				$queries = array(
					array('method' => 'GET', 'relative_url' => '/me/permissions'),
					array('method' => 'GET', 'relative_url' => '/me')
				);
				$batchResponse = $facebook->api('?batch='.Q::json_encode($queries), 'POST');
				$permissions = json_decode($batchResponse[0]['body'], true);
				if (Q::ifset($permissions, 'data', 0, 'email', false)) {
					$userData = json_decode($batchResponse[1]['body'], true);
					if (!empty($userData['email'])) {
						$emailAddress = $userData['email'];
					}
				}
			}

			$authenticated = true;
			$fb_uid = $facebook->getUser();
			$re_save_user = false;
			if ($retrieved) {
				if (empty($user->fb_uid)) {
					// this is a logged-in user who was never authenticated with facebook.
					// First, let's find any other user who has authenticated with this facebook uid,
					// and set their fb_uid to NULL.
					$authenticated = 'connected';
					$ui = Users::identify('facebook', $fb_uid);
					if ($ui) {
						Users_User::update()->set(array(
							'fb_uid' => 0
						))->where(array('id' => $ui->userId))->execute();
						$ui->remove();
					}

					// Now, let's associate their account with this facebook uid.
					$user->fb_uid = $fb_uid;
					$user->save();

					// Save the identifier in the quick lookup table
					$ui = new Users_Identify();
					$ui->identifier = "facebook:$fb_uid";
					$ui->state = 'verified';
					$ui->userId = $user->id;
					$ui->save(true);
				} else if ($user->fb_uid !== $fb_uid) {
					// The logged-in user was authenticated with facebook already,
					// and associated with a different facebook id.
					// Most likely, a completely different person has logged into facebook
					// at this computer. So rather than changing the associated facebook uid
					// for the logged-in user, simply log out and essentially run this function
					// from the beginning again.
					Users::logout();
					$user_was_logged_in = false;
					$user = new Users_User();
					$retrieved = false;
				}
			}
			if (!$retrieved) {
				$ui = Users::identify('facebook', $fb_uid, null);
				if ($ui) {
					$user = new Users_User();
					$user->id = $ui->userId;
					$exists = $user->retrieve();
					if (!$exists) {
						throw new Q_Exception("Users_Identify for fb_uid $fb_uid exists but not user with id {$ui->userId}");
					}
					$retrieved = true;
					if ($ui->state === 'future') {
						$authenticated = 'adopted';

						$user->fb_uid = $fb_uid;
						$user->signedUpWith = 'facebook'; // should have been "none" before this
						/**
						 * @event Users/adoptFutureUser {before}
						 * @param {Users_User} user
						 * @param {string} during
						 * @return {Users_User}
						 */
						$ret = Q::event('Users/adoptFutureUser', compact('user', 'during'), 'before');
						if ($ret) {
							$user = $ret;
						}
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
						Q::event('Users/adoptFutureUser', compact('user', 'links', 'during'), 'after');
					} else {
						// If we are here, that simply means that we already verified the
						// $fb_uid => $userId mapping for some existing user who signed up
						// and has been using the system. So there is nothing more to do besides
						// setting this user as the logged-in user below.
					}
				} else {
					// user is logged out and no user corresponding to $fb_uid yet

					$authenticated = 'registered';

					// If we can import email address from facebook,
					// try retrieving it quietly
					if ($import_emailAddress) {
						// DELAY: The following call may take some time,
						// but once the user is saved, it will not happen again
						// for this facebook user, because it would be identified by fb_uid
						$userData = $facebook->api('/me');
						if (!empty($userData['email'])) {
							$emailAddress = $userData['email'];
						}
						Users::$cache['facebookUserData'] = $userData;
					}

					if (!empty($emailAddress)) {
						$ui = Users::identify('email', $emailAddress, 'verified');
						if ($ui) {
							// existing user  identified from verified email address
							// load it into $user
							$user = new Users_User();
							$user->id = $ui->userId;
							$user->retrieve(null, null, true)
							->caching()
							->resume();
						}
					}

					$user->fb_uid = $fb_uid;
					/**
					 * @event Users/insertUser {before}
					 * @param {Users_User} user
					 * @param {string} during
					 * @return {Users_User}
					 */
					$ret = Q::event('Users/insertUser', compact('user', 'during'), 'before');
					if (isset($ret)) {
						$user = $ret;
					}
					if (!$user->wasRetrieved()) {
						// Register a new user basically and give them an empty username for now
						$user->username = "";
						$user->icon = 'default';
						$user->signedUpWith = 'facebook';
						$user->save();

						// Save the identifier in the quick lookup table
						$ui = new Users_Identify();
						$ui->identifier = "facebook:$fb_uid";
						$ui->state = 'verified';
						$ui->userId = $user->id;
						$ui->save(true);

						// Download and save facebook icon for the user
						$sizes = Q_Config::expect('Users', 'icon', 'sizes');
						sort($sizes);
						$icon = array();
						foreach ($sizes as $size) {
							$parts = explode('x', $size);
							$width = Q::ifset($parts, 0, '');
							$height = Q::ifset($parts, 1, '');
							$width = $width ? $width : $height;
							$height = $height ? $height : $width;
							$icon["$size.png"] = "http://graph.facebook.com/$fb_uid/picture?width=$width&height=$height";
						}
						if (!Q_Config::get('Users', 'register', 'icon', 'leaveDefault', false)) {
							self::importIcon($user, $icon);
							$user->save();
						}
					}
			 	}
			}
			Users::$cache['user'] = $user;
			Users::$cache['authenticated'] = $authenticated;

			// Checking if user email is not set, and we have facebook "email" permission,
			// try retrieving it from facebook and verifying the email for the user
			if (!empty($emailAddress)) {
				$emailSubject = Q_Config::get('Users', 'transactional', 'authenticated', 'subject', false);
				$emailView = Q_Config::get('Users', 'transactional', 'authenticated', 'body', false);
				if ($emailSubject !== false and $emailView) {
					$user->addEmail($emailAddress, $emailSubject, $emailView);
				}

				// After this, we automatically verify their email,
				// even if they never clicked the confirmation link,
				// because we trust the authentication provider.
				$user->setEmailAddress($emailAddress, true);
			}

			break;
		default:
			// not sure how to log this user in
			return $user_was_logged_in ? $user : false;
		}
		if (!$user_was_logged_in) {
			self::setLoggedInUser($user);
		}

		if ($retrieved) {
			/**
			 * @event Users/updateUser {after}
			 * @param {Users_User} user
			 * @param {string} during
			 */
			Q::event('Users/updateUser', compact('user', 'during'), 'after');
		} else {
			/**
			 * @event Users/insertUser {after}
			 * @param {string} during
			 * @param {Users_User} 'user'
			 */
			Q::event('Users/insertUser', compact('user', 'during'), 'after');
		}

		// Now make sure our master session contains the
		// session info for the provider app.
		if ($provider == 'facebook') {
			$access_token = $facebook->getAccessToken();
			if (isset($_SESSION['Users']['appUsers']['facebook_'.$appId])) {
				// Facebook app user exists. Do we need to update it? (Probably not!)
				$pk = $_SESSION['Users']['appUsers']['facebook_'.$appId];
				$app_user = Users_AppUser::select('*')->where($pk)->fetchDbRow();
				if (empty($app_user)) {
					// somehow this app_user disappeared from the database
					throw new Q_Exception_MissingRow(array(
						'table' => 'AppUser',
						'criteria' => http_build_query($pk, null, ' & ')
					));
				}
				if (empty($app_user->state) or $app_user->state !== 'added') {
					$app_user->state = 'added';
				}

				if (!isset($app_user->access_token)
				 or $access_token != $app_user->access_token) {
					/**
					 * @event Users/authenticate/updateAppUser {before}
					 * @param {Users_User} user
					 */
					Q::event('Users/authenticate/updateAppUser', compact('user', 'app_user'), 'before');
					$app_user->access_token = $access_token;
					$app_user->save(); // update access_token in app_user
					/**
					 * @event Users/authenticate/updateAppUser {after}
					 * @param {Users_User} user
					 */
					Q::event('Users/authenticate/updateAppUser', compact('user', 'app_user'), 'after');
				}
			} else {
				// We have to put the session info in
				$app_user = new Users_AppUser();
				$app_user->userId = $user->id;
				$app_user->provider = 'facebook';
				$app_user->appId = $appId;
				if ($app_user->retrieve()) {
					// App user exists in database. Do we need to update it?
					if (!isset($app_user->access_token)
					 or $app_user->access_token != $access_token) {
						/**
						 * @event Users/authenticate/updateAppUser {before}
						 * @param {Users_User} user
						 */
						Q::event('Users/authenticate/updateAppUser', compact('user', 'app_user'), 'before');
						$app_user->access_token = $access_token;
						$app_user->save(); // update access_token in app_user
						/**
						 * @event Users/authenticate/updateAppUser {after}
						 * @param {Users_User} user
						 */
						Q::event('Users/authenticate/updateAppUser', compact('user', 'app_user'), 'after');
					}
				} else {
					if (empty($app_user->state) or $app_user->state !== 'added') {
						$app_user->state = 'added';
					}
					$app_user->access_token = $access_token;
					$app_user->provider_uid = $user->fb_uid;
					/**
					 * @event Users/insertAppUser {before}
					 * @param {Users_User} user
					 * @param {string} 'during'
					 */
					Q::event('Users/insertAppUser', compact('user', 'during'), 'before');
					// The following may update an existing app_user row
					// in the rare event that someone tries to tie the same
					// provider account to two different accounts.
					// A provider account can only reference one account, so the
					// old connection will be dropped, and the new connection saved.
					$app_user->save(true);
					/**
					 * @event Users/authenticate/insertAppUser {after}
					 * @param {Users_User} user
					 */
					Q::event('Users/authenticate/insertAppUser', compact('user'), 'after');
					$authenticated = 'authorized';
				}
			}

			$_SESSION['Users']['appUsers']['facebook_'.$appId] = $app_user->getPkValue();
		}

		Users::$cache['authenticated'] = $authenticated;

		/**
		 * @event Users/authenticate {after}
		 * @param {string} provider
		 * @param {string} appId
		 */
		Q::event('Users/authenticate', compact('provider', 'appId'), 'after');

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
		$return = Q::event('Users/login', compact('identifier', 'passphrase'), 'before');
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
			throw new Users_Exception_NoSuchUser(compact('identifier'));
		}

		// First, see if we've already logged in somehow
		if ($logged_in_user = self::loggedInUser()) {
			// Get logged in user from session
			if ($logged_in_user->id === $user->id) {
				return $logged_in_user;
			}
		}

		// User exists in database. Now check the passphrase.
		$passphraseHash = $user->computePassphraseHash($passphrase, $isHashed);
		if ($passphraseHash != $user->passphraseHash) {
			// Passphrases don't match!
			throw new Users_Exception_WrongPassphrase(compact('identifier'), 'passphrase');
		}

		/**
		 * @event Users/login {after}
		 * @param {string} identifier
		 * @param {string} passphrase
		 * @param {Users_User} 'user'
		 */
		Q::event('Users/login', compact(
			'identifier', 'passphrase', 'user'
		), 'after');
		// Now save this user in the session as the logged-in user
		self::setLoggedInUser($user);
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

		// One last chance to do something.
		// Hooks shouldn't be able to cancel the logout.
		/**
		 * @event Users/logout {before}
		 * @param {Users_User} user
		 */
		Q::event('Users/logout', compact('user'), 'before');

		$deviceId = isset($_SESSION['Users']['deviceId'])
			? $_SESSION['Users']['deviceId']
			: null;

		$device = new Users_Device();
		$device->sessionId = $sessionId; // WARNING: NON-PK LOOKUP. Should store device id in session!
		
		if ($user) {
			Q_Utils::sendToNode(array(
				"Q/method" => "Users/logout",
				"sessionId" => Q_Session::id(),
				"userId" => $user->id,
				"deviceId" => $deviceId
			));

			// forget the device for this user/session
			Users_Device::delete()->where(array(
				'userId' => $user->id,
				'sessionId' => $sessionId
			))->execute();
		}

		// Destroy the current session, which clears the $_SESSION and all notices, etc.
		Q_Session::destroy();
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

		$nonce = Q_Session::$nonceWasSet or Q_Valid::nonce($throwIfNotLoggedIn, true);

		if (!$nonce or !isset($_SESSION['Users']['loggedInUser']['id'])) {
			if ($throwIfNotLoggedIn) {
				throw new Users_Exception_NotLoggedIn();
			}
			return null;
		}
		$id = $_SESSION['Users']['loggedInUser']['id'];
		$user = Users_User::fetch($id);
		if (!$user and $throwIfNotLoggedIn) {
			throw new Users_Exception_NotLoggedIn();
		}
		return $user;
	}

	/**
	 * Use with caution! This bypasses authentication.
	 * This functionality should not be exposed externally.
	 * @method setLoggedInUser
	 * @static
	 * @param {Users_User|string} $user The user object or user id
	 */
	static function setLoggedInUser($user = null)
	{
		if (!$user) {
			return Users::logout();
		}
		if (is_string($user)) {
			$user = Users_User::fetch($user);
		}
		if (isset($_SESSION['Users']['loggedInUser']['id'])) {
			if ($user->id == $_SESSION['Users']['loggedInUser']['id']) {
				// This user is already the logged-in user.
				return;
			}
		}

		if ($sessionId = Q_Session::id()) {
			// Change the session id to prevent session fixation attacks
			$sessionId = Q_Session::regenerateId(true);
		}

		// Store the new information in the session
		$snf = Q_Config::get('Q', 'session', 'nonceField', 'nonce');
		$_SESSION['Users']['loggedInUser']['id'] = $user->id;
		Q_Session::setNonce(true);
		
		$user->sessionCount = isset($user->sessionCount)
			? $user->sessionCount + 1
			: 1;

		// Do we need to update it?
		if (Q_Config::get('Users', 'setLoggedInUser', 'updateSessionKey', true)) {
			/**
			 * @event Users/setLoggedInUser/updateSessionKey {before}
			 * @param {Users_User} user
			 */
			Q::event('Users/setLoggedInUser/updateSessionKey', compact('user'), 'before');
			$user->sessionId = $sessionId;
			$user->save(); // update sessionId in user
			/**
			 * @event Users/setLoggedInUser/updateSessionKey {after}
			 * @param {Users_User} user
			 */
			Q::event('Users/setLoggedInUser/updateSessionKey', compact('user'), 'after');
		}
		
		$votes = Users_Vote::select('*')
			->where(array(
				'userId' => $user->id,
				'forType' => 'Users/hinted'
			))->fetchDbRows(null, null, 'forId');
		
		// Cache already shown hints in the session.
		// The consistency of this mechanism across sessions is not perfect, i.e.
		// the same hint may repeat in multiple concurrent sessions, but it's ok.
		$_SESSION['Users']['hinted'] = array_keys($votes);

		/**
		 * @event Users/setLoggedInUser {after}
		 * @param {Users_User} user
		 */
		Q::event('Users/setLoggedInUser', compact('user'), 'after');
		self::$loggedOut = false;
	}

	/**
	 * Registers a user in the system.
	 * @method register
	 * @static
	 * @param {string} $username The name of the user
	 * @param {string} $identifier User identifier
	 * @param {array|string} [$icon=array()] Array of filename => url pairs
	 * @param {string} [$provider=null] Provider
	 * @param {array} $options=array() An array of options that could include:
	 *  "activation": The key under "Users"/"transactional" config to use for sending an activation message.
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
		$provider = null, 
		$options = array())
	{
		if (is_array($provider)) {
			$options = $provider;
			$provider = null;
		}

		/**
		 * @event Users/register {before}
		 * @param {string} username
		 * @param {string} identifier
		 * @param {string} icon
		 * @param {string} provider
		 * @return {Users_User}
		 */
		$return = Q::event('Users/register', compact('username', 'identifier', 'icon', 'provider', 'options'), 'before');
		if (isset($return)) {
			return $return;
		}

		$during = 'register';

		if (Q_Valid::email($identifier, $emailAddress)) {
			$ui_identifier = $emailAddress;
			$key = 'email address';
			$type = 'email';
		} else if (Q_Valid::phone($identifier, $mobileNumber)) {
			$key = 'mobile number';
			$ui_identifier = $mobileNumber;
			$type = 'mobile';
		} else {
			throw new Q_Exception_WrongType(array(
				'field' => 'identifier',
				'type' => 'email address or mobile number'
			), array('emailAddress', 'mobileNumber'));
		}

		$user = false;
		if ($provider) {
			if ($provider != 'facebook') {
				throw new Q_Exception_WrongType(array('field' => 'provider', 'type' => '"facebook"'));
			}
			$facebook = Users::facebook();
			if ($facebook) {
				$uid = $facebook->getUser();
				try {
					// authenticate (and possibly adopt) an existing provider user
					// or insert a new user during this authentication
					$user = Users::authenticate($provider, null, $authenticated, true);
				} catch (Exception $e) {

				}
				if ($user) {
					// the user is also logged in
					$adopted = true;

					// Adopt this provider user
					/**
					 * @event Users/adoptFutureUser {before}
					 * @param {Users_User} user
					 * @param {string} during
					 * @return {Users_User}
					 */
					$ret = Q::event('Users/adoptFutureUser', compact('user', 'during'), 'before');
					if ($ret) {
						$user = $ret;
					}
				}
			}
		}
		if (!$user) {
			$user = new Users_User(); // the user we will save in the database
		}
		if (empty($adopted)) {
			// We will be inserting a new user into the database, so check if
			// this identifier was already verified for someone else.
			$ui = Users::identify($type, $ui_identifier);
			if ($ui) {
				throw new Users_Exception_AlreadyVerified(compact('key'), array(
					'emailAddress', 'mobileNumber', 'identifier'
				));
			}
		}

		// Insert a new user into the database, or simply modify an existing (adopted) user
		$user->username = $username;
		if (!isset($user->signedUpWith) or $user->signedUpWith == 'none') {
			$user->signedUpWith = $type;
		}
		$user->icon = 'default';
		$user->passphraseHash = '';
		$url_parts = parse_url(Q_Request::baseUrl());
		if (isset($url_parts['host'])) {
			// By default, the user's url would be this:
			$user->url = $username ? "http://$username.".$url_parts['host'] : "";
		}
		/**
		 * @event Users/insertUser {before}
		 * @param {string} during
		 * @param {Users_User} user
		 */
		Q::event('Users/insertUser', compact('user', 'during'), 'before');
		$user->save(); // sets the user's id

		/**
		 * @event Users/insertUser {after}
		 * @param {string} during
		 * @param {Users_User} user
		 */
		Q::event('Users/insertUser', compact('user', 'during'), 'after');

		$sizes = Q_Config::expect('Users', 'icon', 'sizes');
		sort($sizes);

		if (empty($icon)) {
			switch ($provider) {
			case 'facebook':
				// let's get this user's icon on facebook
				if (empty($uid)) {
					break;
				}
				$icon = array();
				foreach ($sizes as $size) {
					$icon["$size.png"] = "http://graph.facebook.com/$uid/picture?width=$size&height=$size";
				}
				break;
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
			} else {
				// locally generated icons
				$hash = md5(strtolower(trim($identifier)));
				$icon = array();
				foreach ($sizes as $size) {
					$icon["$size.png"] = array('hash' => $hash, 'size' => $size);
				}
			}
		}
		if (!Q_Config::get('Users', 'register', 'icon', 'leaveDefault', false)) {
			self::importIcon($user, $icon);
			$user->save();
		}

		if (empty($user->emailAddress) and empty($user->mobileNumber)){
			// Add an email address or mobile number to the user, that they'll have to verify
			try {
				$activation = Q::ifset($options, 'activation', 'activation');
				$subject = Q_Config::get('Users', 'transactional', $activation, "subject", null);
				$body = Q_Config::get('Users', 'transactional', $activation, "body", null);
				if ($type === 'email') {
					$user->addEmail($identifier, $subject, $body);
				} else if ($type === 'mobile') {
					$p = array();
					if ($delay = Q_Config::get('Users', 'register', 'delaySms', 0)) {
						$p['delay'] = $delay;
					}
					$sms = Q_Config::get('Users', 'transactional', $activation, "sms", null);
					$user->addMobile($mobileNumber, $sms, array(), $p);
				}
			} catch (Exception $e) {
				// The activation message could not be sent, so remove this user
				// from the database. This way, this username will be
				// back on the market.
				$user->remove();
				throw $e;
			}
		}

		/**
		 * @event Users/register {after}
		 * @param {string} username
		 * @param {string} identifier
		 * @param {string} icon
		 * @param {Users_User} user
		 * @param {string} provider
		 * @return {Users_User}
		 */
		$return = Q::event('Users/register', compact(
			'username', 'identifier', 'icon', 'user', 'provider', 'options'
		), 'after');

		return $user;
	}

	/**
	 * Returns a user in the database that corresponds to the contact info, if any.
	 * @method userFromContactInfo
	 * @static
	 * @param {string} $type Could be one of "email", "mobile", "email_hashed", "mobile_hashed", "facebook", "twitter" or "token"
	 * @param {string} $value The value corresponding to the type. If $type is:
	 *
	 * * "email" - this is one of the user's email addresses
	 * * "mobile" - this is one of the user's mobile numbers
	 * * "email_hashed" - this is the standard hash of the user's email address
	 * * "mobile_hashed" - this is the standard hash of the user's mobile number
	 * * "facebook" - this is the user's id on facebook
	 * * "twitter": - this is the user's id on twitter
	 * * "token": - this is the invitation token
	 *
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
	 * Returns Users_Identifier rows that correspond to the identifier in the database, if any.
	 * @method identify
	 * @static
	 * @param {string|array} $type Could be one of "email", "mobile", "email_hashed", "mobile_hashed", "facebook" or "twitter"
	 *    It could also be an array of ($type => $value) pairs. Then $state should be null.
	 * @param {string} $value The value corresponding to the type. If $type is
	 *
	 * * "email" - this is one of the user's email addresses
	 * * "mobile" - this is one of the user's mobile numbers
	 * * "email_hashed" - this is the standard hash of the user's email address
	 * * "mobile_hashed" - this is the standard hash of the user's mobile number
	 * * "facebook" - this is the user's id on facebook
	 * * "twitter": - this is the user's id on twitter
	 *
	 * @param {string} [$state='verified'] The state of the identifier => userId mapping.
	 *  Could also be 'future' to find identifiers attached to a "future user",
	 *  and can also be null (in which case we find mappings in all states)
	 * @param {&string} [$normalized=null]
	 * @return {Users_Identify}
	 *  The row corresponding to this type and value, otherwise null
	 */
	static function identify($type, $value, $state = 'verified', &$normalized=null)
	{
		$identifiers = array();
		$expected_array = is_array($type);
		$types = is_array($type) ? $type : array($type => $value);
		foreach ($types as $type => $value) {
			switch ($type) {
			case 'email':
				// for efficiency, we check only the hashed version, and expect it to be there
				Q_Valid::email($value, $normalized);
				$ui_type = 'email_hashed';
				$ui_value = Q_Utils::hash($normalized);
				break;
			case 'mobile':
				// for efficiency, we check only the hashed version, and expect it to be there
				Q_Valid::phone($value, $normalized);
				$ui_type = 'mobile_hashed';
				$ui_value = Q_Utils::hash($normalized);
				break;
			default:
				$ui_type = $type;
				$ui_value = $value;
			}
			$supported = array(
				'email_hashed' => true,
				'mobile_hashed' => true,
				'facebook' => true,
				'twitter' => true
			);
			if (empty($supported[$ui_type])) {
				throw new Q_Exception_WrongValue(array('field' => 'type', 'range' => 'a supported type'));
			}
			$identifiers[] = "$ui_type:$ui_value";
		}
		$uis = Users_Identify::select('*')->where(array(
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
	 * @param {string} $type Could be one of "email", "mobile", "email_hashed", "mobile_hashed", "facebook", "twitter" or "none".
	 * @param {string} $value The value corresponding to the type. If $type is:
	 *
	 * * "email" - this is one of the user's email addresses
	 * * "mobile" - this is one of the user's mobile numbers
	 * * "email_hashed" - this is the email, already hashed with Q_Utils::hash()
	 * * "mobile_hashed" - this is the email, already hashed with Q_Utils::hash()
	 * * "facebook" - this is the user's id on facebook
	 * * "twitter" - this is the user's id on twitter
	 * * "none" - the type is ignored, no "identify" rows are inserted into the db, etc.
	 * 
	 * With every type except "none", the user will be 
	 *
	 * NOTE: If the person we are representing here comes and registers the regular way,
	 * and then later adds an email, mobile, or authenticates with a provider,
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
		if (!array_key_exists($type, self::$types)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'type', 
				'type' => 'one of the supported types'
			));
		}

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
		if ($field = self::$types[$type]) {
			$user->$field = $value;
		}
		$user->signedUpWith = 'none'; // this marks it as a future user for now
		$user->username = "";
		$user->icon = 'future';
		$during = 'future';
		/**
		 * @event Users/insertUser {before}
		 * @param {string} during
		 * @param {Users_User} 'user'
		 */
		Q::event('Users/insertUser', compact('user', 'during'), 'before');
		$user->save(); // sets the user's id
		/**
		 * @event Users/insertUser {after}
		 * @param {string} during
		 * @param {Users_User} user
		 */
		Q::event('Users/insertUser', compact('user', 'during'), 'after');

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
			// Save hashed version
			$ui = new Users_Identify();
			$hashed = Q_Utils::hash($value);
			$ui->identifier = $type."_hashed:$hashed";
			$ui->state = 'future';
			if (!$ui->retrieve()) {
				$ui->userId = $user->id;
				$ui->save();
			}
			$status = $ui->state;
		}
		return $user;
	}

	/**
	 * Returns external data about the user
	 * @method external
	 * @param {string} $publisherId The id of the user corresponding to the publisher consuming the external data
	 * @param {string} $userId The id of the user whose external data is going to be consumed
	 * @return {Users_External}
	 */
	static function external($publisherId, $userId)
	{
		$ue = new User_External();
		$ue->publisherId = $publisherId;
		$ue->userId = $userId;
		if (!$ue->retrieve()) {
			$ue->save(); // should create a unique xid
		}
		return $ue;
	}

	/**
	 * Imports an icon and sets $user->icon to the url.
	 * @method importIcon
	 * @static
	 * @param {array} $user The user for whom the icon should be downloaded
	 * @param {array} [$urls=array()] Array of urls
	 * @param {string} [$directory=null] Defaults to APP/files/APP/uploads/Users/USERID/icon/imported
	 * @return {string} the path to the icon directory
	 */
	static function importIcon($user, $urls = array(), $directory = null)
	{
		if (empty($directory)) {
			$app = Q_Config::expect('Q', 'app');
			$directory = APP_FILES_DIR.DS.$app.DS.'uploads'.DS.'Users'
				.DS.Q_Utils::splitId($user->id).DS.'icon'.DS.'imported';
		}
		if (empty($urls)) {
			return $directory;
		}
		Q_Utils::canWriteToPath($directory, false, true);
		$type = Q_Config::get('Users', 'login', 'iconType', 'wavatar');
		$largestSize = 0;
		$largestUrl = null;
		$largestImage = null;
		foreach ($urls as $basename => $url) {
			if (!is_string($url)) continue;
			$filename = $directory.DS.$basename;
			$info = pathinfo($filename);
			$size = $info['filename'];
			if ((string)(int)$size !== $size) continue;
			if ($largestSize < (int)$size) {
				$largestSize = (int)$size;
				$largestUrl = $url;
			}
		}
		if ($largestSize) {
			$largestImage = imagecreatefromstring(file_get_contents($largestUrl));
		}
		foreach ($urls as $basename => $url) {
			if (is_string($url)) {
				$filename = $directory.DS.$basename;
				$info = pathinfo($filename);
				$size = $info['filename'];
				$success = false;
				if ($largestImage and (string)(int)$size === $size) {
					if ($size == $largestSize) {
						$image = $largestImage;
						$success = true;
					} else {
						$image = imagecreatetruecolor($size, $size);
						imagealphablending($image, false);
						$success = imagecopyresampled(
							$image, $largestImage, 
							0, 0, 
							0, 0, 
							$size, $size, 
							$largestSize, $largestSize
						);
					}
				}
				if (!$success) {
					$ch = curl_init();
					curl_setopt($ch, CURLOPT_URL, $url);
					curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
					curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
					$data = curl_exec($ch);
					curl_close($ch);
					$image = imagecreatefromstring($data);
				}
				$info = pathinfo($filename);
				switch ($info['extension']) {
					case 'png':
						$func = 'imagepng';
						imagesavealpha($image, true);
						imagealphablending($image, true);
						break;
					case 'jpeg':
					case 'jpeg':
						$func = 'imagejpeg';
						break;
					case 'gif':
						$func = 'imagegif';
						break;
				}
				call_user_func($func, $image, $directory.DS.$info['filename'].'.png');
			} else {
				Q_Image::put(
					$directory.DS.$basename,
					$url['hash'],
					$url['size'],
					$type,
					Q_Config::get('Users', 'login', 'gravatar', false)
				);
			}
		}
		$head = APP_FILES_DIR.DS.$app.DS.'uploads';
		$tail = str_replace(DS, '/', substr($directory, strlen($head)));
		$user->icon = '{{baseUrl}}/uploads'.$tail;
		return $directory;
	}

	/**
	 * If the user is using an app with a provider, this returns the row
	 * @method providerAppUser
	 * @static
	 * @param {string} $provider The name of the provider
	 * @param {string} $appId The id of the app on the provider
	 * @return {Users_AppUser} Returns the row corresponding to the currently logged-in user.
	 * @throws {Q_Exception_WrongType} If argument is wrong
	 */
	static function providerAppUser($provider, $appId)
	{
		if (!isset($provider)) {
			throw new Q_Exception_WrongType(array('field' => 'provider', 'type' => 'one of the supported providers'));
		}

		if (!isset($appId)) {
			throw new Q_Exception_WrongType(array('field' => 'appId', 'type' => 'integer'));
		}

		if (!isset($_SESSION['Users']['appUsers'][$provider.'_'.$appId])) {
			return null;
		}
		return $_SESSION['Users']['appUsers'][$provider.'_'.$appId];
	}

	/**
	 * Hashes a passphrase
	 * @method hashPassphrase
	 * @static
	 * @param {string} $passphrase the passphrase to hash
	 * @param {string} [$existing_hash=null] must provide when comparing with a passphrase
	 * hash that has been already stored. It contains the salt for the passphrase.
	 * @return {string} the hashed passphrase, or "" if the passphrase was ""
	 */
	static function hashPassphrase ($passphrase, $existing_hash = null)
	{
		if ($passphrase === '') {
			return '';
		}

		$hash_function = Q_Config::get(
			'Users', 'passphrase', 'hashFunction', 'sha1'
		);
		$passphraseHash_iterations = Q_Config::get(
			'Users', 'passphrase', 'hashIterations', 1103
		);
		$salt_length = Q_Config::set('Users', 'passphrase', 'saltLength', 0);

		if ($salt_length > 0) {
			if (empty($existing_hash)) {
				$salt = substr(sha1(uniqid(mt_rand(), true)), 0,
					$salt_length);
			} else {
				$salt = substr($existing_hash, - $salt_length);
			}
		}

		$salt2 = isset($salt) ? '_'.$salt : '';
		$result = $passphrase;

		// custom hash function
		if (!is_callable($hash_function)) {
			throw new Q_Exception_MissingFunction(array(
				'function_name' => $hash_function
			));
		}
		$confounder = $passphrase . $salt2;
		$confounder_len = strlen($confounder);
		for ($i = 0; $i < $passphraseHash_iterations; ++$i) {
			$result = call_user_func(
				$hash_function,
				$result . $confounder[$i % $confounder_len]
			);
		}
		$result .= $salt2;

		return $result;
	}

	/**
	 * Gets the facebook object constructed from request and/or cookies
	 * @method facebook
	 * @static
	 * @param {string} $key Defaults to the name of the app
	 * @return {Facebook|null} Facebook object
	 */
	static function facebook($key = null)
	{
		if (!isset($key)) {
			$key = Q_Config::expect('Q', 'app');
		}
		if (isset(self::$facebooks[$key])) {
			return self::$facebooks[$key];
		}

		// Get the facebook object from POST, if any
		if (isset($_POST['signed_request'])) {
			$fb_info = Q_Config::get('Users', 'facebookApps', $key, null);
			if (isset($fb_info['appId']) && isset($fb_info['secret'])) {
				try {
					$facebook = new Facebook(array(
						'appId' => $fb_info['appId'],
						'secret' => $fb_info['secret'],
						'cookie' => true,
						'fileUpload' => true
					));
					Users::$facebooks[$key] = $facebook;
					return $facebook;
				} catch (Exception $e) {
					// do nothing
				}
			}
		}

		// And now, the new facebook js can set fbsr_$appId
		$fb_apps = Q_Config::get('Users', 'facebookApps', array());
		foreach ($fb_apps as $key => $fb_info) {
			if (isset($_COOKIE['fbsr_'.$fb_info['appId']])) {
				try {
					$facebook = new Facebook(array(
						'appId' => $fb_info['appId'],
						'secret' => $fb_info['secret'],
						'cookie' => true,
						'fileUpload' => true
					)); // will set user and session from the cookie
					Users::$facebooks[$fb_info['appId']] = $facebook;
					Users::$facebooks[$key] = $facebook;
					return $facebook;
				} catch (Exception $e) {
					// do nothing
				}
			}
		}

		// Otherwise, this facebook object isn't there
		return null;
	}

	/**
	 * @method fql
	 * @static
	 * @param {Facebook} $facebook Facebook object
	 * @param {string} $fql_query Facebook query
	 * @return {array}
	 * @throws {Q_Exception_WrongType} If $facebook is not instance of Facebook
	 */
	static function fql($facebook, $fql_query)
	{
		/**
		 * @event Users/fql {before}
		 * @param {Facebook} facebook
		 * @param {string} fql_query
		 * @return {array|null}
		 */
		$ret = Q::event('Users/fql', compact('facebook', 'fql_query'), 'before');
		if (isset($ret)) {
			return $ret;
		}
		if (!($facebook instanceof Facebook)) {
			throw new Q_Exception_WrongType(array(
				'field' => '$facebook', 'type' => 'Facebook'
			));
		}
		if (!array_key_exists($fql_query, self::$fql_results)) {
			$results = $facebook->api(array(
				'method' => 'fql.query',
				'query' => $fql_query,
				'callback' => ''
			));
			self::$fql_results[$fql_query] = $results;
		} else {
			$results = self::$fql_results[$fql_query];
		}
		/**
		 * @event Users/fql {after}
		 * @param {Facebook} facebook
		 * @param {string} fql_query
		 * @param {array} results
		 */
		Q::event('Users/fql', compact('facebook', 'fql_query', 'results'), 'after');
		return $results;
	}

	/**
	 * @method facebookFriends
	 * @static
	 * @param {Facebook} $facebook Facebook object
	 * @param {string} [$uid=null] User id
	 * @param {string} [$fields="uid,first_name,last_name,pic_small,pic_big,pic_square,pic,birthday_date,gender,meeting_sex,religion"]
	 * @return {array}
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function facebookFriends(
		$facebook,
		$uid = null,
		$fields = "uid, firstName, lastName, pic_small, pic_big, pic_square, pic, birthday_date, sex, meeting_sex, religion")
	{
		if (!$uid) $uid = $facebook->getUser();
		if (!$uid) throw new Users_Exception_NotLoggedIn();
		$q = "SELECT $fields FROM user WHERE uid IN "
			. "(SELECT uid2 FROM friend WHERE uid1 = $uid)"
			. "OR uid = $uid";
		return self::fql($facebook, $q);
	}

	/**
	 * @method facebookAlbums
	 * @static
	 * @param {Facebook} $facebook Facebook object
	 * @param {string} [$uid=null] User id
	 * @param {string} [$fields="aid,name,description,location,size,link,edit_link,visible,modified_major,object_id"]
	 * @return {array}
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in
	 */
	static function facebookAlbums(
		$facebook,
		$uid = null,
		$fields = "aid, name, description, location, size, link, edit_link, visible, modified_major, object_id")
	{
		if (!$uid) $uid = $facebook->getUser();
		if (!$uid) throw new Users_Exception_NotLoggedIn();
		$q = "SELECT $fields FROM album WHERE owner = $uid";
		return Users::fql($facebook, $q);
	}

	/**
	 * @method facebookPhotos
	 * @static
	 * @param {Facebook} $facebook Facebook object
	 * @param {string} $aid Author id
	 * @param {string} [$fields="pid,aid,owner,src_small,src_small_height,src_small_width,src_big,src_big_height,src_big_width,src,src_height,src_width,link,caption,object_id"]
	 * @return {array}
	 */
	static function facebookPhotos(
		$facebook,
		$aid,
		$fields = "pid, aid, owner, src_small, src_small_height, src_small_width, src_big, src_big_height, src_big_width, src, src_height, src_width, link, caption, object_id ")
	{
		$q = "SELECT $fields FROM photo WHERE aid = \"$aid\"";
		return Users::fql($facebook, $q);
	}

	/**
	 * Adds a link to someone who is not yet a user
	 * @method addLink
	 * @static
	 * @param {string} $address Could be email address, mobile number, etc.
	 * @param {string} [$type=null] One of 'email', 'mobile', 'email_hashed', 'mobile_hashed', 'facebook', or 'twitter' for now.
	 * If not indicated, the function tries to guess by using Q_Valid functions.
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
		// process the address first
		$address = trim($address);
		$ui_type = $type;
		switch ($type) {
			case 'email':
				if (!Q_Valid::email($address, $normalized)) {
					throw new Q_Exception_WrongValue(
						array('field' => 'address', 'range' => 'email address')
					);
				}
				$ui_type = 'email_hashed';
				$ui_value = 'email_hashed:'.Q_Utils::hash($normalized);
				break;
			case 'email_hashed':
				// Assume that the $address was already hashed in the standard way
				// see Q_Utils::hash
				$ui_value = "email_hashed:$address";
				break;
			case 'mobile':
				if (!isset($options['hashed']) and !Q_Valid::phone($address, $normalized)) {
					throw new Q_Exception_WrongValue(
						array('field' => 'address', 'range' => 'phone number')
					);
				}
				$ui_type = 'mobile_hashed';
				$ui_value = 'mobile_hashed:'.Q_Utils::hash($normalized);
				break;
			case 'mobile_hashed':
				// Assume that the $address was already hashed in the standard way
				// see Q_Utils::hash
				$ui_value = "mobile_hashed:$address";
				break;
			case 'facebook':
				if (!isset($options['hashed']) and !is_numeric($address)) {
					throw new Q_Exception_WrongValue(
						array('field' => 'address', 'range' => 'facebook uid')
					);
				}
				$ui_value = "facebook:$address";
				$normalized = $address;
				break;
			case 'twitter':
				if (!isset($options['hashed']) and !is_numeric($address)) {
					throw new Q_Exception_WrongValue(
						array('field' => 'address', 'range' => 'twitter uid')
					);
				}
				$ui_value = "twitter:$address";
				$normalized = $address;
				break;
			default:
				if (Q_Valid::email($address, $normalized)) {
					$ui_type = 'email_hashed';
					$ui_value = 'email_hashed:'.Q_Utils::hash($normalized);
				} else if (Q_Valid::phone($address, $normalized)) {
					$ui_type = 'mobile_hashed';
					$ui_value = 'mobile_hashed:'.Q_Utils::hash($normalized);
				} else {
					throw new Q_Exception_WrongValue(
						array('field' => 'type', 'range' => 'one of email, mobile, email_hashed, mobile_hashed, facebook, twitter')
					);
				}
				break;
		}

		$user = Users::loggedInUser(true);

		// Check if the contact user already exists, and if so, add a contact instead of a link
		$ui = Users::identify($ui_type, $ui_value);
		if ($ui) {
			// Add a contact instead of a link
			$user->addContact($ui->userId, Q::ifset($extraInfo, 'labels', null));
			return $user->id;
		}

		// Add a link if one isn't already there
		$link = new Users_Link();
		$link->identifier = $ui_value;
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
	 * @param {array} $contact_info An array of key => value pairs, where keys can be:
	 *
	 * * "email" => the user's email address
	 * * "mobile" => the user's mobile number
	 * * "email_hashed" => the standard hash of the user's email address
	 * * "mobile_hashed" => the standard hash of the user's mobile number
	 * * "facebook" => the user's facebook uid
	 * * "twitter" => the user's twitter uid
	 *
	 * @return {array}
	 *  Returns an array of all links to this user's contact info
	 */
	static function links($contact_info)
	{
		$links = array();
		$identifiers = array();
		if (!empty($contact_info['email'])) {
			Q_Valid::email($contact_info['email'], $emailAddress);
			$identifiers[] = "email_hashed:".Q_Utils::hash($emailAddress);
		}
		if (!empty($contact_info['mobile'])) {
			Q_Valid::phone($contact_info['mobile'], $mobileNumber);
			$identifiers[] = "mobile_hashed:".Q_Utils::hash($mobileNumber);
		}
		if (!empty($contact_info['email_hashed'])) {
			$identifiers[] = "email_hashed".$contact_info['email_hashed'];
		}
		if (!empty($contact_info['mobile_hashed'])) {
			$identifiers[] = "mobile_hashed:".$contact_info['mobile_hashed'];
		}
		if (!empty($contact_info['facebook'])) {
			$identifiers[] = "facebook:".$contact_info['facebook'];
		}
		if (!empty($contact_info['twitter'])) {
			$identifiers[] = "twitter:".$contact_info['twitter'];
		}
		return Users_Link::select('*')->where(array(
			'identifier' => $identifiers
		))->fetchDbRows();
	}

	/**
	 * Inserts some Users_Contact rows for the locally registered users
	 * who have added links to this particular contact information.
	 * Removes the links after successfully adding the Users_Contact rows.
	 * @method saveContactsFromLinks
	 * @static
	 * @param {array} $contact_info An array of key => value pairs, where keys can be:
	 *
	 * * "email" => the user's email address
	 * * "mobile" => the user's mobile number
	 * * "email_hashed" => the standard hash of the user's email address
	 * * "mobile_hashed" => the standard hash of the user's mobile number
	 * * "facebook" => the user's facebook uid
	 * * "twitter" => the user's twitter uid
	 *
	 * @param {string} $userId The id of the user who has verified these identifiers
	 */
	static function saveContactsFromLinks()
	{
		/**
		 * @event Users/saveContactsFromLinks {before}
		 */
		Q::event('Users/saveContactsFromLinks', array(), 'before');

		$user = self::loggedInUser();

		$contact_info = array();
		foreach (self::$types as $type => $field) {
			if (!empty($user->$field)) {
				$contact_info[$type] = $user->$field;
			}
		}
		$links = $contact_info
			? Users::links($contact_info)
			: array();

		$contacts = array();
		foreach ($links as $link) {
			$extraInfo = json_decode($link->extraInfo, true);
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
		Q::event('Users/saveContactsFromLinks', compact('contacts'), 'after');

		// TODO: Add a handler to this event in the Streams plugin, so that
		// we post this information to a stream on the hub, which will
		// update all its subscribers, who will also run saveContactsFromLinks
		// for their local users.
	}

	/**
	 * Get the email address or mobile number from the request, if it can be deduced
	 * @method requestedIdentifier
	 * @static
	 * @param {&string} [$type=null] The identifier's type will be filled here. Might be "email", "mobile" or "token".
	 * @return {string|null} The identifier, or null if one wasn't requested
	 *
	 * **Note:** *we still have to test it for validity.*
	 */
	static function requestedIdentifier(&$type = null)
	{
		$identifier = null;
		$type = null;
		if (!empty($_REQUEST['identifier'])) {
			$identifier = $_REQUEST['identifier'];
			if (strpos($identifier, ':') !== false) {
				list($type, $token) = explode(':', $identifier);
				if ($type === 'token') {
					return $token;
				}
			}
			if (Q_Valid::email($identifier, $normalized)) {
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

	/**
	 * Saves a new Users_Session row with a copy of all the content from the current session.
	 * @param {string|integer} $duration The key in the Q / session / durations config field or number of seconds
	 * @return {string} the id of the new session
	 */
	static function copyToNewSession($duration = 'year')
	{
		$id = Q_Session::id();
		if (!$id) {
			return null;
		}
		$seconds = is_string($duration)
			? Q_Config::expect('Q', 'session', 'durations', $duration)
			: $duration;
		session_write_close(); // close current session
		$us = new Users_Session();
		$us->id = $id;
		$us->retrieve(null, null, array('lock' => 'FOR UPDATE'));
		$us2 = new Users_Session();
		if ($us->wasRetrieved()) {
			$us2->copyFromRow($us, null, false, true);
			$us2->wasRetrieved(false);
		} else {
			$us2->content = "{}";
			$us2->php = "";
			$us2->deviceId = "";
			$us2->timeout = 0;
		}
		$us2->id = Q_Session::generateId();
		$us2->duration = $seconds;
		$us2->save(false, true);
		$new_id = $us2->id;
		session_start(); // reopen current session
		Q::event("Users/copyToNewSession", array(
			'duration' => $duration,
			'from_sessionId' => $id,
			'to_sessionId' => $us2->id
		), 'after');
		return $us2->id;
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
			$terms_title
		);
		return Q::interpolate($terms_label, array('link' => $terms_link));
	}
	
	/**
	 * Get the url of a user's icon
	 * @param {string} [$icon] The contents of a user row's icon field
	 * @param {string} [$basename=""] The last part after the slash, such as "50.png"
	 * @return {string} The stream's icon url
	 */
	static function iconUrl($icon, $basename = null)
	{
		if (empty($icon)) {
			return null;
		}
		$url = Q::interpolate($icon, array('baseUrl' => Q_Request::baseUrl()));
		$url = Q_Valid::url($url) ? $url : "/plugins/Users/img/icons/$url";
		if ($basename) {
			$url .= "/$basename";
		}
		return Q_Html::themedUrl($url);
	}
	
	/**
	 * Checks whether one user can manage contacts of another user
	 * @static
	 * @param {string} $asUserId The user who would be doing the managing
	 * @param {string} $userId The user whose contacts they are
	 * @param {string} $label The label of the contacts that will be managed
	 * @return {boolean} Whether a contact with this label is allowed to be managed
	 * @throws {Users_Exception_NotAuthorized}
	 */
	static function canManageContacts(
		&$asUserId, 
		$userId, 
		$label, 
		$throwIfNotAuthorized = false
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
			compact('asUserId', 'userId', 'label', 'throwIfNotAuthorized'),
			'before'
		);
		if ($result) {
			$authorized = $result;
		}
		if ($asUserId === $userId and substr($label, 0, 6) === 'Users/') {
			$authorized = true;
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
	 * @return {boolean} Whether this label is allowed to be managed
	 * @throws {Users_Exception_NotAuthorized}
	 */
	static function canManageLabels(
		$asUserId, 
		$userId, 
		$label, 
		$throwIfNotAuthorized = false
	) {
		if ($asUserId === false) {
			return true;
		}
		$authorized = false;
		$result = Q::event(
			"Users/canManageLabels",
			compact('asUserId', 'userId', 'label', 'throwIfNotAuthorized'),
			'before'
		);
		if ($result) {
			$authorized = $result;
		}
		if ($asUserId === $userId and substr($label, 0, 6) === 'Users/') {
			return true;
		}
		if (!$authorized and $throwIfNotAuthorized) {
			throw new Users_Exception_NotAuthorized();
		}
		return $authorized;
	}

	/**
	 * @property $fql_results
	 * @type array
	 * @protected
	 * @default array()
	 */
	protected static $fql_results = array();
	/**
	 * @property $users
	 * @type array
	 * @protected
	 * @default array()
	 */
	protected static $users = array();
	/**
	 * @property $email
	 * @type string
	 * @protected
	 * @default null
	 */
	protected static $email = null; // cached
	/**
	 * @property $types
	 * @type array
	 * @protected
	 */
	/**
	 * Type e-mail
	 * @config $types['email']
	 * @protected
	 * @default 'emailAddressPending'
	 */
	/**
	 * Type mobile
	 * @config $types['mobile']
	 * @protected
	 * @default 'mobileNumberPending'
	 */
	/**
	 * Type facebook
	 * @config $types['facebook']
	 * @protected
	 * @default 'fb_uid'
	 */
	/**
	 * Type twitter
	 * @config $types['twitter']
	 * @protected
	 * @default 'tw_uid'
	 */
	protected static $types = array(
		'none' => null,
		'email_hashed' => null,
		'mobile_hashed' => null,
		'email' => 'emailAddressPending',
		'mobile' => 'mobileNumberPending',
		'facebook' => 'fb_uid',
		'twitter' => 'tw_uid'
	);

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
