<?php
/**
 * @module Users
 */


/**
 * Interface that an adapter must support
 * to implement the Db class.
 * @class Db_Interface
 * @static
 */

interface Users_Platform_Interface
{
	/**
	 * Interface class for external platforms, for Platform adapters.
	 * @class Users_Platform_Interface
	 * @constructor
	 * @param {string} [$appId=Q::app()] Can either be an internal appId or a platform appId.
	 * @param {boolean} [$setCookie=true] Whether to set a cookie to do auth in subsequent requests
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_Platform_Facebook|null} Facebook object
	 */
	function __construct($appId = null, $setCookie = true, $longLived = true);
		
	/**
	 * Gets the logged-in user icon urls
	 * @param {array} $sizes=[Q_Config::expect('Users','icon','sizes')]
	 *  An array of size strings such "80x80"
	 * @return {array|null} Keys are the size strings with optional $suffix
	 *  and values are the urls
	 */
	function icon($sizes = null, $suffix = '');

	/**
	 * Get info about access token
	 * @method accessInfo
	 * @return {array} An array of ($accessToken, $sessionExpires)
	 *  where $sessionExpires may be null
	 */
	function accessInfo();

	/**
	 * Import some fields from facebook. Also fills Users::$cache['platformUserData'].
	 * @param {array} $fields
	 * @return {array}
	 */
	function import($fields);
	
}

/**
 * Class representing an external platform
 *
 * @class Users_Platform
 * @extends Users_Platform_Interface
 */
abstract class Users_Platform implements Users_Platform_Interface
{
	
}