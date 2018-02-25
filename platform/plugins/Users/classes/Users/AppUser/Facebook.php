<?php

/**
 * @module Users
 */

/**
 * Class representing facebook app user.
 *
 * @class Users_AppUser_Facebook
 * @extends Users_AppUser
 */
class Users_AppUser_Facebook extends Users_AppUser implements Users_AppUser_Interface
{
	public $facebook = null;

	/**
	 * Gets an Users_AppUser_Facebook object constructed from request and/or cookies.
	 * It is your job to populate it with a user id and save it.
	 * @constructor
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or a Facebook appId.
	 * @param {boolean} [$setCookie=true] Whether to set fbsr_$appId cookie
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_AppUser_Facebook|null}
	 *  May return null if no such user is authenticated.
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true)
	{
		list($appId, $appInfo) = Users::appInfo('facebook', $appId);
		$fbAppId = (isset($appInfo['appId']) && isset($appInfo['secret']))
			? $appInfo['appId']
			: '';
		$params = array_merge(array(
			'app_id' => $fbAppId,
			'app_secret' => $appInfo['secret']
		));

		// the following may throw an exception
		$facebook = new Facebook\Facebook($params);
		
		// If $defaultAccessToken was not set, then
		// we will save a Facebook\Facebook object but
		// it will not have a default access token set, so
		// Facebook API requests will return an error unless
		// you provide your own access token at request time.

		$defaultAccessToken = null;
		$fbsr = null;
		$result = array();
		if ($authResponse = Q_Request::special('Users.facebook.authResponse', null)) {
			// Users.js sent along Users.facebook.authResponse in the request
			$result = Q::take($authResponse, array(
				'signedRequest', 'accessToken', 'expires', 'expiresIn', 'userID'
			));
			if (!isset($result['expires']) and isset($result['expiresIn'])) {
				$result['expires'] = time() + $result['expiresIn']; // approximately
			}
			if (isset($result['signedRequest'])) {
				$fbsr = $result['signedRequest'];
			}
		} else {
			if (isset($_POST['signed_request'])) {
				// This means that this is being requested from canvas page or page tab
				$fbsr = $_POST['signed_request'];
			} else if (isset($_COOKIE["fbsr_$fbAppId"])) {
				// A previous request has set the fbsr cookie
				// note: the accessToken and expires are not set in this case,
				// and should be retrieved from the Users_AppUser in the database
				$fbsr = $_COOKIE["fbsr_$fbAppId"];
			}
		}
		if ($fbsr) {
			$sr = new Facebook\SignedRequest($facebook->getApp(), $fbsr);
			$accessToken = isset($authResponse['accessToken'])
				? $authResponse['accessToken']
				: $sr->get('oauth_token');
			$result = array(
				'signedRequest' => $fbsr,
				'expires' => $sr->get('expires'),
				'accessToken' => $accessToken,
				'userID' => $sr->get('user_id')
			);
		}
		if (isset($result['accessToken'])) {
			$defaultAccessToken = $result['accessToken'];
			if ($longLived and isset($result['expires'])) {
				$accessToken = new Facebook\Authentication\AccessToken(
					$defaultAccessToken, $result['expires']
				);
				if (!$accessToken->isLongLived()) {
					$oa = $facebook->getOAuth2Client();
					$defaultAccessToken = $oa->getLongLivedAccessToken($defaultAccessToken);
				}
			}
		}
		if ($defaultAccessToken) {
			$facebook->setDefaultAccessToken($defaultAccessToken);
			$defaultAccessToken = $facebook->getDefaultAccessToken();
			$expiresAt = $defaultAccessToken->getExpiresAt();
			$result['accessToken'] = $defaultAccessToken->getValue();
			$result['expires'] = $expiresAt ? $expiresAt->getTimestamp() : null;
		}
		if ($fbsr and $setCookie) {
			Q_Response::setCookie("fbsr_$fbAppId", $fbsr, $result['expires']);
		}
		if ($facebook instanceof Facebook\Facebook
		and $app = $facebook->getApp()) {
			$appuser = new Users_AppUser_Facebook();
			// note that $appuser->userId was not set
			$appuser->platform = 'facebook';
			$appuser->appId = $fbAppId;
			$appuser->platform_uid = $result['userID'];
			$appuser->access_token = $result['accessToken'];
			$appuser->session_expires = $result['expires'];
			$appuser->facebook = $facebook;
			return $appuser;
		}
		return null;
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
		if (!isset($sizes)) {
			$sizes = Q_Config::expect('Users', 'icon', 'sizes');
		}
		sort($sizes);
		if (!$this->platform_uid) {
			return null;
		}
		$icon = array();
		foreach ($sizes as $size) {
			$parts = explode('x', $size);
			$width = Q::ifset($parts, 0, '');
			$height = Q::ifset($parts, 1, '');
			$width = $width ? $width : $height;
			$height = $height ? $height : $width;
			$icon[$size.$suffix] = "https://graph.facebook.com/"
				. $this->platform_uid
				. "/picture?width=$size&height=$size";
		}
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
			$fieldNames = Q_Config::get('Users', 'import', 'facebook', null);
		}
		if (!$fieldNames) {
			return array();
		}
		$uid = $this->platform_uid;
		$response = $this->facebook->get("/$uid?fields=".implode(',', $fieldNames));
		$userNode = $response->getGraphUser();
		Users::$cache['platformUserData'] = array(
			'facebook' => $userNode->uncastItems()
		);
		return $userNode->uncastItems();
	}
}