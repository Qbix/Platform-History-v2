<?php

function Users_login_validate()
{
	if (Q_Request::method() === 'GET') {
		return;
	}

	Q_Valid::nonce(true);
	foreach (array('identifier', 'passphrase') as $field) {
		if (!isset($_REQUEST[$field])) {
			throw new Q_Exception("$field is missing", array($field));
		}
	}
}
