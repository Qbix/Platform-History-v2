<?php

/**
 * This tool renders ways to get in touch
 *
 * @param array [$options] An associative array of options, containing:
 *   @param {string|Users_User} [$options.user] Required. The user object or id of the user exposing their primary identifiers for getting in touch.
 *   @param {boolean|string} [$options.email] Pass true here to use the primary verified email address, if any. Or pass the string label for this button.
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
	$class = null;
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
	$ways = array();
	$email = $sms = $call = false;
	if (!empty($options['email']) and $user->emailAddress) {
		$email = is_string($options['email']) ? $options['email'] : "Email me";
		$email = Q_Html::img("plugins/Users/img/email.png") . $email;
		$ways['email'] = Q_Html::tag($tag, array('id' => 'email', 'class' => $class), $email);
		Q_Response::setToolOptions(array(
			'emailAddress' => Q_Utils::obfuscate($user->emailAddress),
			'emailSubject' => Q_Utils::obfuscate($emailSubject),
			'emailBody' => Q_Utils::obfuscate($emailBody)
		));
	}
	if (Q_Request::isMobile()) {
		$obfuscated_mobileNumber = Q_Utils::obfuscate($user->mobileNumber);
		if (!empty($options['sms']) and $user->mobileNumber) {
			$sms = is_string($options['sms']) ? $options['sms'] : "Text me";
			$sms = Q_Html::img("plugins/Users/img/sms.png") . $sms;
			$ways['sms'] = Q_Html::tag($tag, array('id' => 'sms', 'class' => $class), $sms);
			Q_Response::setToolOptions(array(
				'mobileNumber' => $obfuscated_mobileNumber
			));
		}
		if (!empty($options['call']) and $user->mobileNumber) {
			$call = is_string($options['call']) ? $options['call'] : "Call me";
			$call = Q_Html::img("plugins/Users/img/call.png") . $call;
			$ways['call'] = Q_Html::tag($tag, array('id' => 'call', 'class' => $class), $call);
			Q_Response::setToolOptions(array(
				'mobileNumber' => $obfuscated_mobileNumber
			));
		}
	}
	return implode($between, $ways);
}