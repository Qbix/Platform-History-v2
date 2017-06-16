<?php

/**
 * @module Users
 */

/**
 * Class representing facebook platform.
 *
 * @class Users_Platform_Facebook
 * @extends Users_Platform
 */
class Users_Platform_Facebook extends Users_Platform
{
	public $facebook = null;

	/**
	 * Gets the Users_Platform_Facebook object constructed from request and/or cookies
	 * @constructor
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or a Facebook appId.
	 * @param {boolean} [$setCookie=true] Whether to set fbsr_$appId cookie
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_Platform_Facebook|null} Facebook object
	 */
	function __construct($appId = null, $setCookie = true, $longLived = true)
	{
		$appInfo = Q_Config::expect('Users', 'apps', 'facebook', $appId);
		$fbAppId = (isset($appInfo['appId']) && isset($appInfo['secret']))
			? $appInfo['appId']
			: '';
		$params = array_merge(array(
			'app_id' => $fbAppId,
			'app_secret' => $appInfo['secret']
		));
		// the following may throw an exception
		$facebook = $this->facebook = new Facebook\Facebook($params);

		$defaultAccessToken = null;
		$fbsr = null;
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
			} else if (isset($_COOKIE["fbsr_$appId"])) {
				// A previous request has set the fbsr cookie
				$fbsr = $_COOKIE["fbsr_$appId"];
			}
			if ($fbsr) {
				$sr = new Facebook\SignedRequest($facebook->getApp(), $fbsr);
				$accessToken = isset($authResponse['accessToken']) ? $authResponse['accessToken'] : $sr->get('oauth_token');
				$result = array(
					'signedRequest' => $fbsr,
					'expires' => $sr->get('expires'),
					'accessToken' => $accessToken,
					'userID' => $sr->get('user_id')
				);
			}
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
		}
		if ($fbsr and $setCookie) {
			Q_Response::setCookie("fbsr_$appId", $fbsr);
		}
		// If $defaultAccessToken was not, set, then
		// we will savae a Facebook\Facebook object but
		// it will not have a default access token set, so
		// Facebook API requests will return an error unless
		// you provide your own access token at request time.
	}

	/**
	 * If a user is logged into the platform, and the platform sent us
	 * some sort of signed request (which we may have saved in a cookie)
	 * this function returns the user's uid on that platform.
	 * @return {string} The platform uid of user logged into the platform, if any
	 */
	function loggedInUid()
	{
		$facebook = $this->facebook;
		if ($facebook instanceof Facebook\Facebook
		and $app = $facebook->getApp()) {
			if ($fbsr = Q::ifset($_COOKIE, 'fbsr_'.$app->getId(), null)) {
				$sr = new Facebook\SignedRequest($facebook->getApp(), $fbsr);
				return $sr->getUserId();
			}
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
	function loggedInUserIcon($sizes = null, $suffix = '')
	{
		if (!isset($sizes)) {
			$sizes = Q_Config::expect('Users', 'icon', 'sizes');
		}
		sort($sizes);
		$uid = $this->loggedInUid();
		if (!$uid) {
			return null;
		}
		$icon = array();
		foreach ($sizes as $size) {
			$parts = explode('x', $size);
			$width = Q::ifset($parts, 0, '');
			$height = Q::ifset($parts, 1, '');
			$width = $width ? $width : $height;
			$height = $height ? $height : $width;
$icon[$size.$suffix] = "https://graph.facebook.com/$uid/picture?width=$size&height=$size";
		}
		return $icon;
	}
	
	/**
	 * @method accessInfo
	 * @return {array} An array of ($accessToken, $sessionExpires)
	 *  where $sessionExpires may be null
	 */
	function accessInfo()
	{
		$at = $this->facebook->getDefaultAccessToken();
		$expiresAt = $at->getExpiresAt();
		$sessionExpires = $expiresAt ? $expiresAt->getTimestamp() : null;
		$accessToken = $at->getValue();
		return array($accessToken, $sessionExpires);
	}

	/**
	 * Import some fields from facebook. Also fills Users::$cache['platformUserData'].
	 * @param {array} $fields
	 * @return {array}
	 */
	function import($fields)
	{
		if (!is_array($fields)) {
			$fields = Q_Config::get('Users', 'import', 'facebook', null);
		}
		if (!$fields) {
			return array();
		}
		$response = $this->facebook->get('/me?fields='.implode(',', $fields));
		$userNode = $response->getGraphUser();
		Users::$cache['platformUserData'] = array(
			'facebook' => $userNode->uncastItems()
		);
		return $userNode->uncastItems();
	}
}