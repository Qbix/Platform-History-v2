<?php

/**
 * @module Users
 */

/**
 * Class representing an external platform
 *
 * @class Users_Platform
 * @extends Users_Platform_Interface
 */
class Users_Platform_Facebook implements Users_Platform_Interface
{	
	/**
	 * If a user is logged in the platform, and the platform sent us
	 * some sort of signed request (which we may have saved in a cookie)
	 * this function returns the user's uid on that platform.
	 */
	function loggedInUid()
	{
		$facebook = $this->facebook;
		if ($facebook instanceof Facebook\Facebook
		and $app = $facebook->getApp()) {
			if ($fbsr = Q::ifset($_COOKIE, 'fbsr_'.$app->getId(), null)) {
				$sr = new Facebook\SignedRequest($platform->getApp(), $fbsr);
				return $sr->getUserId();
			}
		}
		return null;
	}
}