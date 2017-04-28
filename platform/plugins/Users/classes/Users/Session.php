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
	 * @param {string|integer} [$duration='year'] The key in the Q / session / durations config field or number of seconds
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