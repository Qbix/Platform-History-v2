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
		return $url . $char . http_build_query(@compact('body'), '', '&', PHP_QUERY_RFC3986);
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
			. ($text ? '&' . http_build_query(@compact('text'), '', '&', PHP_QUERY_RFC3986) : '');
	}
	
	/**
     * Generates a link for opening Telegram to a channel and taking an action,
     * or prefilling text and URL and/or offering to share it with contacts.
     * More info here: https://core.telegram.org/api/links#group-channel-bot-links
     *
     * @method telegram
     * @static
     * @param {string} [to] Phone number with country code e.g. "+1", or username starting with "@".
     *  Or pass null here and supply text (and optional URL) to open Telegram and let the user
     *  choose Telegram users, channels, and groups to share to.
     * @param {string} [text] The text to share. Although it can contain a URL, try using options.url when "to" is empty.
     * @param {array} [options]
     * @param {string} [options.action] Can be "voicechat", "videochat" or "livestream" if it was scheduled already.
     * @param {string} [options.actionValue] If action is specified, optionally provide an invite hash here.
     * @param {string} [options.url] Optionally put a URL to share here, which will appear ahead of the text.
     * @param {string} [options.start] “start” parameter for a bot.
     * @param {string} [options.startgroup] “startgroup” parameter for a bot.
     * @param {string} [options.startchannel] "startchannel" parameter for a bot.
     * @param {string} [options.startapp] “startapp” parameter for a bot to launch a mini-app.
     * @param {string} [options.admin] Admin permissions for a bot to have in a group or channel.
     * @param {string} [options.appname] "appname" name of the mini-app for the bot to launch, if it has several.
     * @param {string} [options.startattach] "startattach" parameter for a bot after being attached to a user, group, or channel.
     * @param {string|array} [options.choose] Can be one or more of "users", "bots", "groups", "channels".
     * @param {string} [options.attach] If to is a chat, then this is the name of a bot to attach to a chat.
     * @param {string} [options.game] The short_name of a game to share with a bot.
     * @return {string} The generated Telegram URL.
     */
	static function telegram ($to = null, $text = null, $options = array()) {
        $urlParams = [];
        $options = $options ?? [];

        if (!$to) { // Share URL with some users to select in Telegram
            $command = 'msg';
            if (!empty($options['url'])) {
                // NOTE: special characters won't work in text,
                // better to keep options.url blank and place URL in text
                array_unshift($urlParams, 'url=' . urlencode($options['url']));
                $command = 'msg_url';
            }
            if ($text) {
                $urlParams[] = 'text=' . urlencode($text);
            }
            return 'tg://' . $command . '?' . implode('&', $urlParams);
        }

        $where = ($to[0] === '@' ? 'domain=' : 'phone=') . $to;

        if (!empty($options['action'])) {
            $v = !empty($options['actionValue']) ? ('=' . urlencode($options['actionValue'])) : '';
            return 'tg://resolve?' . $where . '&' . $options['action'] . $v;
        }

        $botcommands = false;
        $keys = ['start', 'startgroup', 'startchannel', 'admin', 'startapp', 'appname', 'startattach', 'choose', 'game'];
        foreach ($keys as $k) {
            if (!empty($options[$k])) {
                $botcommands = true;
                $urlParams[] = $k . '=' . urlencode($options[$k]);
            }
        }

        if ($botcommands) {
            if (!empty($options['choose'])) {
                if (is_array($options['choose'])) {
                    $options['choose'] = implode('+', $options['choose']);
                }
            }
            return 'tg://resolve?' . $where . '&' . implode('&', $urlParams);
        }

        $urlParams[] = 'to=' . $to;
        if ($text) {
            $urlParams[] = 'text=' . urlencode($text);
        }

        return 'tg://msg?' . implode('&', $urlParams);
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
			. ($url ? '&' . http_build_query(@compact('url'), '', '&', PHP_QUERY_RFC3986) : '');
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
