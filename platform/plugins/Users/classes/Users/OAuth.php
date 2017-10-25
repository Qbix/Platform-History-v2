<?php
/**
 * @module Users
 */
/**
 * Class representing 'OAuth' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a oAuth row in the Users database.
 *
 * @class Users_OAuth
 * @extends Base_Users_OAuth
 */
class Users_OAuth extends Base_Users_OAuth
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
	 * Get an array of ($code => $title) pairs from space-separated list in $_REQUEST['scope'],
	 * defaulting to the "all" scope.
	 * @method requestedScope
	 * @static
	 * @param {string} $client_id The id of the client app
	 * @param {boolean} [$throwIfMissing=false]
	 * @param {reference} [$scopes] this is filled with an array
	 * @return {array}
	 */
	static function requestedScope($client_id, $throwIfMissing = false, &$scopes = null)
	{
		$rs = Q::ifset($_REQUEST, 'scope', 'all');
		if (is_string($rs)) {
			$rs = preg_split("/(,|\s+|,+\s*)+/", $rs);
		}
		$scopes = Q_Config::get('Users', 'authorize', 'clients', $client_id, 'scopes', array(
			'all' => 'give this app full access'
		));
		if ($throwIfMissing) {
			foreach ($rs as $s) {
				if ($s and !isset($scopes[$s])) {
					throw new Q_Exception_WrongValue(array(
						'field' => 'scope',
						'range' => json_encode(array_keys($scopes))
					));
				}
			}
		}
		$scope = array(); // copy them in the order they are found in the config
		foreach ($scopes as $k => $v) {
			if (in_array($k, $rs)) {
				$scope[] = $k;
			}
		}
		return $scope;
	}
	
	/**
	 * Fetch a Users_OAuth row if it exists, which authorizes
	 * the client app to access the given scope for the given user.
	 * @param {string} $userId The userId of the local user
	 * @param {string} $client_id The userId of the client app
	 * @param {string} [$scope='user'] The scope
	 * @return {Users_OAuth|null}
	 */
	static function fetch($userId, $client_id, $scope='user')
	{
		$rows = oAuth::select()
			->where(compact('userId', 'client_id'))
			->fetchDbRows();
		foreach ($rows as $row) {
			$scopes = array_map('trim', explode(' ', $row->scope));
			foreach ($scopes as $s) {
				if ($scopes === $scope) {
					return $row;
				}
			}
		}
		return null;
	}

	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_OAuth} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_OAuth();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};