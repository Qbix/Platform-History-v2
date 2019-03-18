<?php

/**
 * This tool renders ways to get in touch
 *
 * @param array [$options] An associative array of options, containing:
 *   @param {string|Users_User} $options.user Required. The user object or id of the user exposing their primary identifiers for getting in touch.
 *   @param {string} [$key='blah'] The key to use for obfuscation to try and prevent harvesting
 *   @param {boolean|string} [$options.email] Pass true here to allow emailing on the primary verified email address, if any. Or pass the string label for this button.
 *   @param {string} [$options.emailSubject] Fill this if you want the email subject to be automatically filled in
 *   @param {string} [$options.emailBody] Fill this if you want the email body to be automatically filled in
 *   @param {boolean|string} [$options.sms] Pass true here to allow texting the primary verified mobile number, if any. Or pass the string label for this button.
 *   @param {boolean|string} [$options.call] Pass true here to allow calling the primary verified mobile number, if any. Or pass the string label for this button.
 *   @param {string} [$options.tag] The type of tag to use, defaults to "button"
 *   @param {string} [$options.class] Any classes to add to the tags
 *   @param {string} [$options.between] Any HTML to put between the elements
 */
function Users_getintouch_tool($options)
{
	$tag = 'button';
	$class = '';
	$between = '';
	$user = null;
	$emailSubject = '';
	$emailBody = '';
	extract($options, EXTR_IF_EXISTS);
	if (!$user) {
		throw new Q_Exception_RequiredField(array('field' => 'user'));
	}
	if (is_string($user)) {
		$userId = $user;
		$user = Users_User::fetch($userId);
		if (!$user) {
			throw new Q_Exception_MissingRow(array('table' => 'user', 'criteria' => "id=$userId"));
		}
	}
	$key = Q::ifset($options, 'key', 'blah');;
	$ways = array();
	$email = $sms = $call = false;
	if (!empty($options['email']) and $user->emailAddress) {
		$email = is_string($options['email']) ? $options['email'] : "Email me";
		$class2 = $class . ' Users_getintouch_email';
		$ways['email'] = Q_Html::tag($tag, array('id' => 'email', 'class' => $class2), $email);
		Q_Response::setToolOptions(array(
			'emailAddress' => Q_Utils::obfuscate($user->emailAddress),
			'emailSubject' => Q_Utils::obfuscate($emailSubject),
			'emailBody' => Q_Utils::obfuscate($emailBody, $key),
			'key' => $key
		));
	}
	if (Q_Request::isMobile()) {
		$obfuscated_mobileNumber = Q_Utils::obfuscate($user->mobileNumber, $key);
		if (!empty($options['sms']) and $user->mobileNumber) {
			$sms = is_string($options['sms']) ? $options['sms'] : "Text me";
			$class2 = $class . ' Users_getintouch_sms';
			$ways['sms'] = Q_Html::tag($tag, array('id' => 'sms', 'class' => $class2), $sms);
			Q_Response::setToolOptions(array(
				'mobileNumber' => $obfuscated_mobileNumber,
				'key' => $key
			));
		}
		if (!empty($options['call']) and $user->mobileNumber) {
			$call = is_string($options['call']) ? $options['call'] : "Call me";
			$class2 = $class . ' Users_getintouch_call';
			$ways['call'] = Q_Html::tag($tag, array('id' => 'call', 'class' => $class2), $call);
			Q_Response::setToolOptions(array(
				'mobileNumber' => $obfuscated_mobileNumber,
				'key' => $key
			));
		}
	}
	return implode($between, $ways);
}