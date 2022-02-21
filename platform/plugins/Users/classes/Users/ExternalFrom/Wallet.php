<?php

/**
 * @module Users
 */

/**
 * Class representing Wallet app user.
 * THIS IS DEPRECATED in favor of Web3
 *
 * @class Users_ExternalFrom_Wallet
 * @extends Users_ExternalFrom
 */
class Users_ExternalFrom_Wallet extends Users_ExternalFrom implements Users_ExternalFrom_Interface
{
	/**
	 * DEPRECATED
     * @method authenticate
	 * @static
	 * @param {string} [$appId=Q::app()] Can either be an interal appId or an Web3 appId.
	 * @param {boolean} [$setCookie=true] Whether to set fbsr_$appId cookie
	 * @param {boolean} [$longLived=true] Get a long-lived access token, if necessary
	 * @return {Users_ExternalFrom_Web3|null}
	 *  May return null if no such user is authenticated.
	 */
	static function authenticate($appId = null, $setCookie = true, $longLived = true)
	{
        return null;
	}

	/**
	 * DEPRECATED
	 * @param {array} [$sizes=Q_Image::getSizes('Users/icon')]
	 *  An array of size strings such "80x80"
	 * @return {array|null} [$suffix=''] Keys are the size strings with optional $suffix
	 *  and values are the urls
	 */
	function icon($sizes = null, $suffix = '')
	{
		// TODO: import from etherscan or use blockies as fallback
		return array();
	}

	/**
	 * DEPRECATED
	 * @param {array} $fieldNames
	 * @return {array}
	 */
	function import($fieldNames)
	{
        return array();
	}
}