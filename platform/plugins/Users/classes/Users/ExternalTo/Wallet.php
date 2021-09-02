<?php

/**
 * @module Users
 */

/**
 * Class representing Wallet app user.
 *
 * @class Users_ExternalTo_Wallet
 * @extends Users_ExternalTo
 */
class Users_ExternalTo_Wallet extends Users_ExternalTo implements Users_ExternalTo_Interface
{
	/**
	 * Gets a Users_ExternalTo_Wallet object constructed from request and/or cookies.
	 * It is your job to populate it with a user id and save it.
	 * @constructor
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or an Wallet appId.
	 * @param {boolean} [$setCookie=true] Whether to set fbsr_$appId cookie
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_ExternalTo_Wallet|null}
	 *  May return null if no such user is authenticated.
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true)
	{
		list($appId, $appInfo) = Users::appInfo('wallet', $appId);
		$platformAppId = (isset($appInfo['appId']) && isset($appInfo['secret']))
			? $appInfo['appId']
			: '';

		$udid = Q::ifset($_REQUEST, 'Q_udid', null);
		if (!$udid) {
			$udid = Q::ifset($_COOKIE, 'Q_udid', null);
			if (!$udid) {
				return null;
			}
		}
		if ($setCookie) {
			Q_Response::setCookie("Q_udid", $udid, 0);
		}
		$ef = new Users_ExternalTo_Wallet();
		// note that $ef->userId was not set
		$ef->platform = 'wallet';
		$ef->appId = $platformAppId;
		$ef->xid = $udid;
		$ef->accessToken = null;
		$ef->expires = null;
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
		$platform = 'wallet';
		if (!is_array($fieldNames)) {
			$fieldNames = Q_Config::get('Users', 'import', $platform, null);
		}
		if (!$fieldNames) {
			return array();
		}
	}
}