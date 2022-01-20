<?php

/**
 * @module Users
 */

use Crypto\EthSigRecover;

/**
 * Class representing Web3 app user.
 *
 * @class Users_ExternalFrom_Web3
 * @extends Users_ExternalFrom
 */
class Users_ExternalFrom_Web3 extends Users_ExternalFrom implements Users_ExternalFrom_Interface
{
	/**
	 * Gets a Users_ExternalFrom_Web3 object constructed from request and/or cookies.
	 * It is your job to populate it with a user id and save it.
	 * @method authenticate
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or an Web3 appId.
	 * @param {boolean} [$setCookie=true] Whether to set fbsr_$appId cookie
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_ExternalFrom_Web3|null}
	 *  May return null if no such user is authenticated.
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true)
	{
		list($appId, $appInfo) = Users::appInfo('web3', $appId);
		$platformAppId = Q::ifset($appInfo, 'appId', 'all');
		if (!$platformAppId) {
			$platformAppId = Q::ifset($_REQUEST, 'chainId', 'all');
		}
		if ($platformAppId === 'all'
		or substr($platformAppId, 0, 2) !== '0x') {
			throw new Q_Exception_BadValue(array(
				'internal' => 'Users/apps config',
				'problem' => "appId should be a string starting from 0x, not $platformAppId"
			));
		}
		$appIdForAuth = !empty($appInfo['appIdForAuth'])
			? $appInfo['appIdForAuth']
			: $appInfo['appId'];
		$xid = strtolower(Q::ifset($_REQUEST, 'xid', null));
		if (!is_callable('gmp_add') or !is_callable('gmp_mod')) {
			throw new Q_Exception('Web3 authentication requires installing PHP gmp extensions');
		}
		$payload = Q::ifset($_REQUEST, 'payload', null);
		$signature = Q::ifset($_REQUEST, 'signature', null);
		if (!$payload or $signature) {
			$cookieName = "wsr_$platformAppId";
			if (isset($_COOKIE[$cookieName])) {
				// A previous request has set the wsr cookie
				$wsr_json = $_COOKIE[$cookieName];
				if ($wsr = Q::json_decode($wsr_json, true)) {
					list($payload, $signature) = $wsr;
				}
			}
		}
		Q_Valid::requireFields(array('payload', 'signature'), @compact('payload', 'signature'),true);
		$e = new Crypto\EthSigRecover();
		$recoveredXid = strtolower(
			$e->personal_ecRecover($payload, $signature)
		);
		if ($xid and strtolower($recoveredXid) != $xid) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'xid',
				'range' => $xid
			));
		}
		$xid = $recoveredXid;
		$expires = time() + Q::ifset($appInfo, 'expires', 60*60);
		$cookieNames = array("Q_Users_wsr_$appIdForAuth", "Q_Users_wsr_$appIdForAuth".'_expires');
		if ($xid and $setCookie) {
			$parts = array($payload, $signature);
			Q_Response::setCookie($cookieNames[0], Q::json_encode($parts), $expires);
			Q_Response::setCookie($cookieNames[1], $expires, $expires);
		}
		$ef = new Users_ExternalFrom_Web3();
		// note that $ef->userId was not set
		$ef->platform = 'web3';
		$ef->appId = $appIdForAuth;
		$ef->xid = $xid;
		$ef->accessToken = null;
		$ef->expires = $expires;
		$ef->set('cookiesToClearOnLogout', $cookieNames);
		return $ef;
	}

	/**
	 * Gets the logged-in user icon urls
	 * @param {array} [$sizes=Q_Image::getSizes('Users/icon')]
	 *  An array of size strings such "80x80"
	 * @return {array|null} [$suffix=''] Keys are the size strings with optional $suffix
	 *  and values are the urls
	 */
	function icon($sizes = null, $suffix = '')
	{
		// TODO: import from etherscan or use blockies as fallback
		$icon = array();
		return $icon;
	}

	/**
	 * Import some fields from the platform. Also fills Users::$cache['platformUserData'].
	 * @param {array} $fieldNames
	 * @return {array}
	 */
	function import($fieldNames)
	{
		// TODO: import from etherscan or use blockies as fallback
		$platform = 'web3';
		if (!is_array($fieldNames)) {
			$fieldNames = Q_Config::get('Users', 'import', $platform, null);
		}
		if (!$fieldNames) {
			return array();
		}
	}
}