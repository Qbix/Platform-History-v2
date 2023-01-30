<?php

/**
 * @module Users
 */

/**
 * Class for interacting with Discourse
 *
 * @class Users_ExternalFrom_Facebook
 * @extends Users_ExternalFrom
 */
class Users_ExternalFrom_Discourse extends Users_ExternalFrom implements Users_ExternalFrom_Interface
{
	/**
	 * Gets an Users_ExternalFrom_Discourse object constructed from request and/or cookies.
	 * It is your job to populate it with a user id and save it.
	 * @method authenticate
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or a Discourse appId.
	 * @param {boolean} [$setCookie=true] Whether to set dcsr_$appId cookie with the payload
	 * @return {Users_ExternalFrom_Discourse|null}
	 *  May return null if no such user is authenticated.
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true)
	{
		list($appId, $appInfo) = Users::appInfo('discourse', $appId);
		$discourseAppId = (isset($appInfo['appId']) && isset($appInfo['secret']))
			? $appInfo['appId']
			: '';
		// if ($facebook instanceof Facebook\Facebook
		// and $app = $facebook->getApp()) {
		// 	$ef = new Users_ExternalFrom_Facebook();
		// 	// note that $ef->userId was not set
		// 	$ef->platform = 'facebook';
		// 	$ef->appId = $appId;
		// 	$ef->xid = $result['userID'];
		// 	$ef->accessToken = $result['accessToken'];
		// 	$ef->expires = isset($result['expires']) && is_integer($result['expires'])
		// 		? $result['expires']
		// 		: Db::fromDateTime($result['expires']);
		// 	$ef->facebook = $facebook;
		// 	$ef->set('cookiesToClearOnLogout', $cookieNames);
		// 	return $ef;
		// }
		return null;
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
		if (!isset($sizes)) {
			$sizes = array_keys(Q_Image::getSizes('Users/icon'));
		}
		sort($sizes);
		if (!$this->xid) {
			return null;
		}
		$icon = array();
		// foreach ($sizes as $size) {
		// 	$parts = explode('x', $size);
		// 	$width = Q::ifset($parts, 0, '');
		// 	$height = Q::ifset($parts, 1, '');
		// 	$width = $width ? $width : $height;
		// 	$height = $height ? $height : $width;
		// 	$icon[$size.$suffix] = "https://graph.facebook.com/"
		// 		. $this->xid
		// 		. "/picture?width=$width&height=$width";
		// }
		// TODO: IMPLEMENT THIS
		return $icon;
	}

	/**
	 * Import some fields from facebook. Also fills Users::$cache['platformUserData'].
	 * @param {array} $fieldNames
	 * @return {array}
	 */
	function import($fieldNames)
	{
		if (!is_array($fieldNames)) {
			$fieldNames = Q_Config::get('Users', 'import', 'discourse', null);
		}
		if (!$fieldNames) {
			return array();
		}
		// TODO: IMPLEMENT THIS
		return array();
	}
}