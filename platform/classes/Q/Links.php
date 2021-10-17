<?php

/**
 * @module Q
 */

/**
 * Methods for working with links
 * @class Q_Uri
 * @constructor
 */
class Q_Links
{
	protected function __construct()
	{
		
	}
	
	/**
	 * Generates a link for sending an sms message
	 * @static
	 * @method sms
	 * @param {string} [body]
	 * @param {string|Array} [mobileNumbers]
	 * @return {string}
	 */
	static function sms ($body, $mobileNumbers = null)
	{
		$ios = (Q_Request::platform() === 'ios');
		if ($mobileNumbers && is_array($mobileNumbers)) {
			$temp = array();
			foreach ($mobileNumbers as $m) {
				$temp[] = rawurlencode($m);
			}
			$mobileNumbers = ($ios ? '/open?addresses=' : '') . implode(',', $temp);
		}
		$url = "sms:" . ($mobileNumbers ? $mobileNumbers : ($ios ? '%20' : ''));
		$char = $ios ? '&' : '?';
		return $url . $char . http_build_query(@compact('body'), null, '&', PHP_QUERY_RFC3986);
	}
	/**
	 * Generates a link for sending an email message
	 * @static
	 * @method email
	 * @param {string} [subject]
	 * @param {string} [body]
	 * @param {string|Array} [to]
	 * @param {string|Array} [cc]
	 * @param {string|Array} [bcc]
	 * @return {string}
	 */
	static function email ($subject, $body, $to = null, $cc = null, $bcc = null)
	{
		$ios = (Q_Request::platform() === 'ios');
		$to = $to && is_array($to) ? implode(',', $to) : $to;
		$cc = $cc && is_array($cc) ? implode(',', $cc) : $cc;
		$bcc = $bcc && is_array($bcc) ? implode(',', $bcc) : $bcc;
		$names = array('cc', 'bcc', 'subject', 'body');
		$parts = array($cc, $bcc, $subject, $body);
		$url = "mailto:" . ($to ? $to : '');
		$char = '?';
		foreach ($names as $i => $name) {
			if ($p = $parts[$i]) {
				$url .= $char . $name . '=' . ($i >= 2 ? rawurlencode($p) : $p);
				$char = '&';
			}
		}
		return $url;
	}
	
	/**
	 * Generates a link for opening a WhatsApp message to a number
	 * @static
	 * @method whatsApp
	 * @param {string} [$phoneNumber] This should include the country code, without the "+"
	 * @param {string} [$text] The text can include a URL that will be expanded in the chat
	 * @return {string}
	 */
	static function whatsApp ($phoneNumber, $text = null)
	{
		return 'whatsapp://send/?phone=' . $phoneNumber
			. ($text ? '&' . http_build_query(@compact('text'), null, '&', PHP_QUERY_RFC3986) : '');
	}
	
	/**
	 * Generates a link for sharing a link in Telegram
	 * @static
	 * @method telegramShare
	 * @param {string} [$ to] Phone number with country code e.g. "+1", or username starting with "@".
	 *  If a username, then don't supply text or url, it can only open a window to chat.
	 *  Set this to false and supply text (and optional url) to open Telegram and let the user
	 *  choose Telegram users, channels and groups to share to.
	 * @param {string} [$text] The text to share, can contain a URL, so need to include the next parameter.
	 * @param {string} [$url] Optionally put a URL to share here, which will appear ahead of the text
	 * @return {string}
	 */
	static function telegram ($to, $text = null, $url = null)
	{
		if ($to && $to[0] === '@') {
			return 'tg://resolve?domain=' . substr($to, 1);
		}
		return ($url
			? 'tg://msg_url?' . http_build_query(@compact('url', 'text'))
			: 'tg://msg?' . http_build_query(@compact('text'), null, '&', PHP_QUERY_RFC3986)
		) . ($to ? '&to=' . $to : '');
	}
	
	/**
	 * Generates a link for sharing a link in Skype
	 * @static
	 * @method telegramShare
	 * @param {string} [$text] The text to share, can contain a URL
	 * @param {string} [$url] The URL to share
	 * @return {string}
	 */
	static function skype ($text, $url = null)
	{
		return 'https://web.skype.com/share?'
			. ($text ? '&' . http_build_query(@compact('text')) : '')
			. ($url ? '&' . http_build_query(@compact('url'), null, '&', PHP_QUERY_RFC3986) : '');
	}
	
	/**
	 * Generates a link for opening in android chrome browser.
	 * Usable in other browsers on Android.
	 * @static
	 * @method androidChrome
	 * @param {string} [$url]
	 * @return {string}
	 */
	static function androidChrome ($url)
	{
		return 'googlechrome://navigate?url=' . $url; // note: don't encode
	}
}
