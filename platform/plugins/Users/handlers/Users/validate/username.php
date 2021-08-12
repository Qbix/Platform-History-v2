<?php

/**
 * Override this to validate the username in your own way.
 */
function Users_validate_username($params)
{
	// override this to change the rules for validating the username
	extract($params);
	if (empty($username)) {
		return;
	}
	if (!empty($user)) {
		if (Users::isCommunityId($user->id)) {
			// first letter is uppercase, this represents a specially recognized
			// organization or app, so allow anything in the username
			return;
		}
	}
	if (strlen($username) < 4) {
		throw new Q_Exception("usernames are at least 4 characters long", array('username'));
	}
	if (strlen($username) > (new Users_User())->maxSize_username()) {
		throw new Q_Exception("usernames are at most 16 characters long", array('username'));
	}
	$match = preg_match('/^[a-zA-Z][a-zA-Z0-9-_]+$/', $username);
	if (!$match) {
		if (preg_match('/^[a-zA-Z0-9-_]+$/', $username)) {
			throw new Q_Exception("usernames must start with a letter", array('username'));
		}
		throw new Q_Exception("please use only A..Z, a..z, 0..9, - and _", array('username'));
	}
}
