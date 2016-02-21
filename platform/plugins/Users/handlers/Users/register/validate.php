<?php

function Users_register_validate()
{
	Q_Valid::nonce(true);

	foreach (array('identifier', 'username', 'icon') as $field) {
		if (!isset($_REQUEST[$field])) {
			throw new Q_Exception("$field is missing", array($field));
		}
	}
}
