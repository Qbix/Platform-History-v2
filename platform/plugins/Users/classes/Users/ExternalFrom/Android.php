<?php

/**
 * @module Users
 */

/**
 * Class representing Android app user.
 *
 * @class Users_ExternalFrom_Android
 * @extends Users_ExternalFrom
 */
class Users_ExternalFrom_Android extends Users_ExternalFrom implements Users_ExternalFrom_Interface
{
	/**
	 * Gets a Users_ExternalFrom_Android object constructed from request and/or cookies.
	 * It is your job to populate it with a user id and save it.
	 * @method authenticate
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or an Android appId.
	 * @param {boolean} [$setCookie=true] Whether to set the Q_udid cookie
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_ExternalFrom_Android|null}
	 *  May return null if no such user is authenticated.
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true)
	{
		list($appId, $appInfo) = Users::appInfo('android', $appId);
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
		$ef = new Users_ExternalFrom_Android();
		// note that $ef->userId was not set
		$ef->platform = 'android';
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
		$platform = 'android';
		if (!is_array($fieldNames)) {
			$fieldNames = Q_Config::get('Users', 'import', $platform, null);
		}
		if (!$fieldNames) {
			return array();
		}
	}
}