<?php

/**
 * @module Users
 */

/**
 * Class representing Web3 app user.
 *
 * @class Users_ExternalTo_Web3
 * @extends Users_ExternalTo
 */
class Users_ExternalTo_Web3 extends Users_ExternalTo implements Users_ExternalTo_Interface
{
	/**
	 * Gets a Users_ExternalTo_Web3 object constructed from request and/or cookies.
	 * It is your job to populate it with a user id and save it.
	 * @constructor
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or an Web3 appId.
	 * @param {boolean} [$setCookie=true] Whether to set fbsr_$appId cookie
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_ExternalTo_Web3|null}
	 *  May return null if no such user is authenticated.
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true)
	{
		list($appId, $appInfo) = Users::appInfo('web3', $appId);
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
		$ef = new Users_ExternalTo_Web3();
		// note that $ef->userId was not set
		$ef->platform = 'web3';
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
		$platform = 'web3';
		if (!is_array($fieldNames)) {
			$fieldNames = Q_Config::get('Users', 'import', $platform, null);
		}
		if (!$fieldNames) {
			return array();
		}
	}
}