<?php

function Streams_register_validate()
{
	Q_Valid::nonce(true);

	$fields = Users::loggedInUser() ? array('fullName') : array('identifier', 'fullName', 'icon');

	foreach ($fields as $field) {
		if (!isset($_REQUEST[$field])) {
			throw new Q_Exception("$field is missing", array($field));
		}
	}
	
	$length_min = Q_Config::get('Streams', 'inputs', 'fullName', 'lengthMin', 5);
	$length_max = Q_Config::get('Streams', 'inputs', 'fullName', 'lengthMax', 30);
	if (strlen($_REQUEST['fullName']) < $length_min) {
		throw new Q_Exception("Your full name can't be that short.", 'fullName');
	}
	if (strlen($_REQUEST['fullName']) > $length_max) {
		throw new Q_Exception("Your full name can't be that long.", 'fullName');
	}
}
