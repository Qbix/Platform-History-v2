<?php

/**
 * @module Users
 */

use Crypto\EthSigRecover;

/**
 * Class representing Wallet app user.
 *
 * @class Users_ExternalFrom_Wallet
 * @extends Users_ExternalFrom
 */
class Users_ExternalFrom_Wallet extends Users_ExternalFrom implements Users_ExternalFrom_Interface
{
	/**
	 * Gets a Users_ExternalFrom_Wallet object constructed from request and/or cookies.
	 * It is your job to populate it with a user id and save it.
	 * @constructor
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or an Wallet appId.
	 * @param {boolean} [$setCookie=true] Whether to set fbsr_$appId cookie
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_ExternalFrom_Wallet|null}
	 *  May return null if no such user is authenticated.
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true)
	{
		list($appId, $appInfo) = Users::appInfo('wallet', $appId);
		$platformAppId = Q::ifset($appInfo, 'appId', 1);
		if (!$platformAppId) {
			$platformAppId = Q::ifset($_REQUEST, 'chainId', 1);
		}
		if (!intval($platformAppId)) {
			throw new Q_Exception_BadValue(array(
				'internal' => 'Users/apps config',
				'problem' => "appId has to be a numeric chainId, not $platformAppId"
			));
		}
		$xid = strtolower(Q::ifset($_REQUEST, 'xid', null));
		if (is_callable('gmp_add') and is_callable('gmp_mod')) {
			Q_Request::requireFields(array('payload', 'signature'), true);
			$e = new Crypto\EthSigRecover();
			$recoveredXid = strtolower(
				$e->personal_ecRecover($_REQUEST['payload'], $_REQUEST['signature'])
			);
			if ($xid and strtolower($recoveredXid) != $xid) {
				throw new Q_Exception_WrongValue(array(
					'field' => 'xid',
					'range' => $xid
				));
			}
			$xid = $recoveredXid;
		}
		if (!$xid) {
			$xid = Q::ifset($_COOKIE, 'Q_Users_wallet_address', null);
		}
		$expires = time() + Q::ifset($appInfo, 'expires', 60*60);
		if ($xid and $setCookie) {
			Q_Response::setCookie("Q_Users_wallet_address", $xid, $expires);
		}
		$ef = new Users_ExternalFrom_Wallet();
		// note that $ef->userId was not set
		$ef->platform = 'wallet';
		$ef->appId = $platformAppId;
		$ef->xid = $xid;
		$ef->accessToken = null;
		$ef->expires = $expires;
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
		$platform = 'wallet';
		if (!is_array($fieldNames)) {
			$fieldNames = Q_Config::get('Users', 'import', $platform, null);
		}
		if (!$fieldNames) {
			return array();
		}
	}
}