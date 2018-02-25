<?php

/**
 * @module Users
 */

/**
 * Class representing Android app user.
 *
 * @class Users_AppUser_Android
 * @extends Users_AppUser
 */
class Users_AppUser_Android extends Users_AppUser implements Users_AppUser_Interface
{
	/**
	 * Gets a Users_AppUser_Android object constructed from request and/or cookies.
	 * It is your job to populate it with a user id and save it.
	 * @constructor
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or an Android appId.
	 * @param {boolean} [$setCookie=true] Whether to set fbsr_$appId cookie
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_AppUser_Android|null}
	 *  May return null if no such user is authenticated.
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true)
	{
		list($appId, $appInfo) = Users::appInfo('android', $appId);
		$platformAppId = (isset($appInfo['appId']) && isset($appInfo['secret']))
			? $appInfo['appId']
			: '';
		
		$udid = Q::ifset($_COOKIE, 'Q_udid', null);
		if (!$udid) {
			return null;
		}
		$appuser = new Users_AppUser_Android();
		// note that $appuser->userId was not set
		$appuser->platform = 'android';
		$appuser->appId = $platformAppId;
		$appuser->platform_uid = $udid;
		$appuser->access_token = null;
		$appuser->session_expires = null;
		return $appuser;
	}

	/**
	 * Gets the logged-in user icon urls
	 * @param {array} $sizes=[Q_Config::expect('Users','icon','sizes')]
	 *  An array of size strings such "80x80"
	 * @return {array|null} Keys are the size strings with optional $suffix
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
		if (!$fields) {
			return array();
		}
	}
}