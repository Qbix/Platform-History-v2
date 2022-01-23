<?php

/**
 * @module Users
 */

/**
 * Class representing twitch app user.
 *
 * @class Users_ExternalFrom_Twitch
 * @extends Users_ExternalFrom
 */
class Users_ExternalFrom_Twitch extends Users_ExternalFrom implements Users_ExternalFrom_Interface
{
	public $twitch = null;

	/**
	 * Gets an Users_ExternalFrom_Twitch object constructed from request and/or cookies.
	 * It is your job to populate it with a user id and save it.
	 * @method authenticate
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or a Twitch appId.
	 * @param {boolean} [$setCookie=true] Whether to set fbsr_$appId cookie
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_ExternalFrom_Twitch|null}
	 *  May return null if no such user is authenticated.
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true)
	{
		list($appId, $appInfo) = Users::appInfo('twitch', $appId);
		$platformAppId = isset($appInfo['appIdForAuth'])
			? $appInfo['appIdForAuth']
			: $appInfo['appId'];
			
		// TODO: implement
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
		// TODO: implement
		return array();
	}

	/**
	 * Import some fields from twitch. Also fills Users::$cache['platformUserData'].
	 * @param {array} $fieldNames
	 * @return {array}
	 */
	function import($fieldNames)
	{
		// TODO: implement
		return array();
	}
}