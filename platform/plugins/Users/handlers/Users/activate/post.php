<?php

function Users_activate_post()
{
	Q_Valid::nonce(true);
	
	/**
	 * @var Users_User $user
	*/
	$email = $mobile = $type = $user = null;
	extract(Users::$cache, EXTR_IF_EXISTS);
	
	$text = Q_Text::get('Users/content');

	if (isset($_REQUEST['passphrase'])) {
		if (empty($_REQUEST['passphrase'])) {
			throw new Q_Exception("You can't set a blank passphrase.", 'passphrase');
		}
		
		$isHashed = !empty($_REQUEST['isHashed']);
		if ($isHashed and $isHashed !== 'true' and intval($_REQUEST['isHashed']) > 1) {
			// this will let us introduce other values for isHashed in the future
			throw new Q_Exception("Please set isHashed to 0 or 1", 'isHashed');
		}

		// Save the pass phrase even if there may be a problem adding an email later.
		// At least the user will be able to log in.
		$passphrase = $user->preparePassphrase($_REQUEST['passphrase'], $isHashed);
		$user->passphraseHash = $user->hashPassphrase($passphrase, $user->passphraseHash);
		Q_Response::setNotice("Users/activate/passphrase",  $text['notifications']['PassphraseSaved'], array(
			'timeout' => Q_Config::get('Users', 'notices', 'timeout', 5)
		));
		// Log the user in, since they were able to set the passphrase
		Users::setLoggedInUser($user); // This also saves the user.

		if (empty($user->passphraseHash)) {
			throw new Q_Exception("Please set a pass phrase on your account", 'passphrase', true);
		}
	}

	if ($type) {
		if ($type == 'email address') {
			$user->setEmailAddress($email->address, true); // may throw exception	
		} else if ($type == 'mobile number') {
			$user->setMobileNumber($mobile->number, true); // may throw exception
		}
		// Log the user in, since they have just added an email to their account
		$activated = Q::interpolate($text['notifications']['IdentifierActivated'], @compact('type'));
		Users::setLoggedInUser($user); // This also saves the user.
		Q_Response::removeNotice('Users/activate/objects');
		Q_Response::setNotice("Users/activate/activated", $activated, array(
			'timeout' => Q_Config::get('Users', 'notices', 'timeout', 5)
		));
	}
	
	Users::$cache['passphrase_set'] = true;
	Users::$cache['success'] = true;
}
