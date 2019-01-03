<?php
/**
 * @module Users
 */
/**
 * For oAuth methods
 *
 * @class Users_OAuth
 */
class Users_OAuth
{
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
};