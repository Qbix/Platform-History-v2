<?php
/**
 * @module Users
 */
/**
 * Class representing 'Session' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a session row in the Users database.
 *
 * @class Users_Session
 * @extends Base_Users_Session
 */
class Users_Session extends Base_Users_Session
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
	 * Saves a new Users_Session row with a copy of all the content from the current session.
	 * Does not change the current session id.
	 * @method copyToNewSesion
	 * @static
	 * @param {array} $sessionFields Pass an array with keys such as
	 *   "platform", "appId", "version", "deviceId", "formFactor"
	 * @param {string|integer} [$duration='year'] The key in the Q/session/durations config field
	 *   or number of seconds. Pass 0 to expire at the end of browser session.
	 * @return {string} the id of the newly saved Users_Session row
	 */
	static function copyToNewSession($sessionFields, $duration = 'year')
	{
		$id = Q_Session::id();
		if (!$id) {
			return null;
		}
		$seconds = is_string($duration)
			? Q_Config::expect('Q', 'session', 'durations', $duration)
			: $duration;

		$arr = isset($_SESSION['Q']) ? $_SESSION['Q'] : null;
		if (isset($arr)) {
			$fields = Q_Config::get('Q', 'session', 'userAgentInfo', array());
			$_SESSION['Q'] = Q::take($sessionFields, $fields, $arr);
			$_SESSION['Q']['nonce'] = sha1(mt_rand().microtime());
		}

		$us = new Users_Session();
		$us->id = $id;
		$us->retrieve(null, null, array('lock' => 'FOR UPDATE'));
		$us2 = new Users_Session();
		if ($us->wasRetrieved()) {
			$us2->copyFromRow($us, null, false, true);
			$us2->wasRetrieved(false);
			$us2->insertedTime = new Db_Expression('CURRENT_TIMESTAMP');
		} else {
			$us2->timeout = 0;
		}
		$us2->content = Q::json_encode($_SESSION, JSON_FORCE_OBJECT);
		$us2->php = session_encode();
		$us2->id = Q_Session::generateId();
		$us2->duration = $seconds;
		$us2->timeout = 0;
		foreach ($sessionFields as $k => $v) {
			$us2->$k = $v;
		}
		$us2->save(false, true);

		if (isset($arr)) {
			$_SESSION['Q'] = $arr;
		}
		/**
		 * This is a hook for after the session has been copied to a new session.
		 * You may want to do extra security checks here.
		 * You may also want to notify the user that there has been a new session
		 * started from a new platform + appId.
		 * @event Users/Session/copyToNewSession {after}
		 * @param {Users_Session} $from The session that was copied from
		 * @param {Users_Session} $to The session that was copied to
		 */
		Q::event("Users/Session/copyToNewSession", array(
			'from' => $us,
			'to' => $us2
		), 'after');
		return $us2->id;
	}

	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Session} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Session();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};