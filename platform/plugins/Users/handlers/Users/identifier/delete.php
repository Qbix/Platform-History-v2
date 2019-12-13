<?php

function Users_identifier_delete()
{
	$user = Users::loggedInUser(true);
	$identifier = Users::requestedIdentifier($type);

	if (!$type) {
		throw new Q_Exception(
			"a valid email address or mobile number is required", 
			array('identifier', 'mobileNumber', 'emailAddress')
		);
	}

	$user->removeIdentifier($identifier);
}
